use axum::{
    extract::{Path, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, get_service, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::Value;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    SqlitePool,
};
use std::{
    env,
    net::SocketAddr,
    path::PathBuf,
    str::FromStr,
    sync::{
        atomic::{AtomicI64, Ordering},
        Arc,
    },
    time::Duration,
};
use tokio::signal;
use tower_http::{
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use uuid::Uuid;

// Azure File uses SMB locking. A single connection with SQLite's rollback
// journal avoids WAL's shared-memory lock files while this one-replica service
// safely serializes report and limiter writes on the durable mount.
const DURABLE_SQLITE_CONNECTIONS: u32 = 1;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    build_sha: String,
    rate_cleanup_after: Arc<AtomicI64>,
    http: reqwest::Client,
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    build_sha: String,
}

#[derive(Debug, Serialize)]
struct Created {
    id: String,
    expires_at: String,
}

async fn health(State(state): State<AppState>) -> Json<Health> {
    Json(Health {
        status: "ok",
        build_sha: state.build_sha,
    })
}

async fn create_report(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(report): Json<Value>,
) -> Result<(StatusCode, Json<Created>), ApiError> {
    let license = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| ApiError {
            status: StatusCode::PAYMENT_REQUIRED,
            message: "A team-sharing license is required.".into(),
        })?;
    verify_license(&state.http, license).await?;
    store_report(&state.db, report).await
}

async fn store_report(
    db: &SqlitePool,
    report: Value,
) -> Result<(StatusCode, Json<Created>), ApiError> {
    validate_report(&report)?;
    let encoded = serde_json::to_string(&report)
        .map_err(|_| ApiError::bad("The report could not be read."))?;
    if encoded.len() > 200_000 {
        return Err(ApiError::bad("The report is larger than 200 KB."));
    }
    let id = Uuid::new_v4().simple().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::days(30);
    sqlx::query("INSERT INTO reports (id, report, expires_at) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(encoded)
        .bind(expires_at.timestamp())
        .execute(db)
        .await
        .map_err(ApiError::internal)?;
    Ok((
        StatusCode::CREATED,
        Json(Created {
            id,
            expires_at: expires_at.to_rfc3339(),
        }),
    ))
}

async fn verify_license(client: &reqwest::Client, license: &str) -> Result<(), ApiError> {
    let url = "https://api.sociobot.in/api/v1/products/screenreader-task-audit/verify";
    let response = client
        .get(url)
        .query(&[("license", license)])
        .send()
        .await
        .map_err(|error| {
            tracing::warn!(%error, "license service unavailable");
            ApiError {
                status: StatusCode::SERVICE_UNAVAILABLE,
                message: "The license service is unavailable. Try sharing again shortly.".into(),
            }
        })?;
    let value: Value = response.json().await.map_err(ApiError::internal)?;
    if value.get("valid").and_then(Value::as_bool) == Some(true) {
        Ok(())
    } else {
        Err(ApiError {
            status: StatusCode::PAYMENT_REQUIRED,
            message: "The team-sharing license is not active.".into(),
        })
    }
}

async fn get_report(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, ApiError> {
    if id.len() != 32 || !id.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(ApiError::not_found());
    }
    let now = chrono::Utc::now().timestamp();
    let row: Option<(String,)> =
        sqlx::query_as("SELECT report FROM reports WHERE id = ? AND expires_at > ?")
            .bind(id)
            .bind(now)
            .fetch_optional(&state.db)
            .await
            .map_err(ApiError::internal)?;
    let raw = row.ok_or_else(ApiError::not_found)?.0;
    serde_json::from_str(&raw)
        .map(Json)
        .map_err(ApiError::internal)
}

fn validate_report(value: &Value) -> Result<(), ApiError> {
    let object = value
        .as_object()
        .ok_or_else(|| ApiError::bad("The report must be a JSON object."))?;
    if object.get("schema").and_then(Value::as_str) != Some("screenreader-task-audit/v1") {
        return Err(ApiError::bad("The report schema is not supported."));
    }
    let tasks = object
        .get("tasks")
        .and_then(Value::as_array)
        .ok_or_else(|| ApiError::bad("The report needs a task list."))?;
    if tasks.len() > 5 {
        return Err(ApiError::bad(
            "A report can contain no more than five tasks.",
        ));
    }
    Ok(())
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    message: String,
}
impl ApiError {
    fn bad(message: &str) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }
    fn not_found() -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: "This shared report was not found or has expired.".into(),
        }
    }
    fn internal<E: std::fmt::Display>(error: E) -> Self {
        tracing::error!(%error, "request failed");
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: "The server could not finish this request.".into(),
        }
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(serde_json::json!({"error": self.message})),
        )
            .into_response()
    }
}

async fn rate_limit(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let key = request
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .unwrap_or("unknown")
        .to_string();
    let now_ms = chrono::Utc::now().timestamp_millis();
    let decision = record_api_request(&state.db, &key, now_ms).await;
    maybe_cleanup_rate_limits(&state, now_ms).await;
    match decision {
        Ok(hits) if hits <= 40 => next.run(request).await,
        Ok(_) => rate_limit_response(),
        Err(error) => {
            // A failed limiter must not silently turn into an unlimited API.
            tracing::error!(%error, "rate limiter unavailable");
            let mut response = (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({
                    "error":"The server cannot safely accept this request. Try again in one second."
                })),
            )
                .into_response();
            response
                .headers_mut()
                .insert(header::RETRY_AFTER, HeaderValue::from_static("1"));
            response
        }
    }
}

async fn record_api_request(
    db: &SqlitePool,
    client_key: &str,
    now_ms: i64,
) -> Result<i64, sqlx::Error> {
    // One atomic statement makes the allowance common to every router/process
    // using the same SQLite database. A one-second idle gap opens a fresh burst;
    // continuous traffic cannot refill the allowance while it is still arriving.
    let hits = sqlx::query_scalar::<_, i64>(
        "INSERT INTO api_rate_limits (client_key, hits, last_seen_ms) VALUES (?, 1, ?) \
         ON CONFLICT(client_key) DO UPDATE SET \
           hits = CASE WHEN excluded.last_seen_ms - api_rate_limits.last_seen_ms >= 1000 \
                       THEN 1 ELSE api_rate_limits.hits + 1 END, \
           last_seen_ms = excluded.last_seen_ms \
         RETURNING hits",
    )
    .bind(client_key)
    .bind(now_ms)
    .fetch_one(db)
    .await?;
    Ok(hits)
}

fn rate_limit_response() -> Response {
    let mut response = (
        StatusCode::TOO_MANY_REQUESTS,
        Json(serde_json::json!({"error":"Too many requests. Try again in one second."})),
    )
        .into_response();
    response
        .headers_mut()
        .insert(header::RETRY_AFTER, HeaderValue::from_static("1"));
    response
}

async fn maybe_cleanup_rate_limits(state: &AppState, now_ms: i64) {
    let cleanup_after = state.rate_cleanup_after.load(Ordering::Relaxed);
    if now_ms < cleanup_after
        || state
            .rate_cleanup_after
            .compare_exchange(
                cleanup_after,
                now_ms + 3_600_000,
                Ordering::Relaxed,
                Ordering::Relaxed,
            )
            .is_err()
    {
        return;
    }
    if let Err(error) = sqlx::query("DELETE FROM api_rate_limits WHERE last_seen_ms < ?")
        .bind(now_ms - 3_600_000)
        .execute(&state.db)
        .await
    {
        tracing::warn!(%error, "could not remove expired rate-limit rows");
    }
}

async fn security_headers(request: Request, next: Next) -> Response {
    let path = request.uri().path().to_owned();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'; connect-src 'self' https://api.sociobot.in; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"));
    if path.starts_with("/assets/") {
        headers.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    } else if headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|content_type| content_type.starts_with("text/html"))
        || path == "/service-worker.js"
    {
        // The shell and worker must revalidate so a new deployment is discovered promptly.
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
    }
    response
}

fn app(state: AppState, dist: PathBuf) -> Router {
    let api = Router::new()
        .route("/reports", post(create_report))
        .route("/reports/{id}", get(get_report))
        .layer(RequestBodyLimitLayer::new(220_000))
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit));
    let index = dist.join("index.html");
    let fallback = ServeDir::new(&dist).not_found_service(ServeFile::new(dist.join("404.html")));
    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        // Serve documented client routes explicitly. ServeFile otherwise keeps a 404
        // response status when used as ServeDir's not-found service.
        .route("/", get_service(ServeFile::new(index.clone())))
        .route("/demo", get_service(ServeFile::new(index.clone())))
        .route("/demo/report", get_service(ServeFile::new(index.clone())))
        .route("/audit", get_service(ServeFile::new(index.clone())))
        .route("/report", get_service(ServeFile::new(index.clone())))
        .route("/privacy", get_service(ServeFile::new(index.clone())))
        .route("/terms", get_service(ServeFile::new(index.clone())))
        .route("/share/{id}", get_service(ServeFile::new(index)))
        .fallback_service(fallback)
        .layer(middleware::from_fn(security_headers))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let log_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(log_filter)
        .init();
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let build_sha = env::var("BUILD_SHA").unwrap_or_else(|_| "dev".into());
    let data_dir = env::var("DATA_DIR").unwrap_or_else(|_| "data".into());
    std::fs::create_dir_all(&data_dir)?;
    let db_url = format!("sqlite://{data_dir}/reports.db?mode=rwc");
    let db_options = durable_sqlite_options(&db_url)?;
    let db = SqlitePoolOptions::new()
        .max_connections(DURABLE_SQLITE_CONNECTIONS)
        .connect_with(db_options)
        .await?;
    initialize_database(&db).await?;
    sqlx::query("DELETE FROM reports WHERE expires_at <= ?")
        .bind(chrono::Utc::now().timestamp())
        .execute(&db)
        .await?;
    tracing::info!(port, %build_sha, data_dir, "configuration loaded; no secret configuration required");
    let state = AppState {
        db,
        build_sha,
        rate_cleanup_after: Arc::new(AtomicI64::new(0)),
        http: reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()?,
    };
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await?;
    axum::serve(
        listener,
        app(state, PathBuf::from("dist")).into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown())
    .await?;
    Ok(())
}

fn durable_sqlite_options(
    db_url: &str,
) -> Result<SqliteConnectOptions, Box<dyn std::error::Error + Send + Sync>> {
    Ok(SqliteConnectOptions::from_str(db_url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Delete)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5)))
}

async fn initialize_database(db: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, report TEXT NOT NULL, expires_at INTEGER NOT NULL)")
        .execute(db)
        .await?;
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS api_rate_limits (\
           client_key TEXT PRIMARY KEY, \
           hits INTEGER NOT NULL, \
           last_seen_ms INTEGER NOT NULL\
         ) WITHOUT ROWID",
    )
    .execute(db)
    .await?;
    Ok(())
}

async fn shutdown() {
    let ctrl_c = async { signal::ctrl_c().await.expect("install Ctrl+C handler") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install signal handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::{to_bytes, Body},
        http::Request,
    };
    use tower::ServiceExt;

    async fn state() -> AppState {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        initialize_database(&db).await.unwrap();
        AppState {
            db,
            build_sha: "test-sha".into(),
            rate_cleanup_after: Arc::new(AtomicI64::new(i64::MAX)),
            http: reqwest::Client::new(),
        }
    }

    fn test_dist() -> PathBuf {
        let path = std::env::temp_dir().join(format!("screenreader-task-audit-{}", Uuid::new_v4()));
        std::fs::create_dir_all(path.join("assets")).unwrap();
        std::fs::write(
            path.join("index.html"),
            "<html><body>application shell</body></html>",
        )
        .unwrap();
        std::fs::write(
            path.join("404.html"),
            "<html><body>missing page</body></html>",
        )
        .unwrap();
        std::fs::write(path.join("assets/app-123.js"), "console.log('asset')").unwrap();
        path
    }
    #[tokio::test]
    async fn health_returns_build_sha() {
        let response = app(state().await, test_dist())
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), 1024).await.unwrap();
        assert!(String::from_utf8_lossy(&body).contains("test-sha"));
    }
    #[tokio::test]
    async fn sharing_requires_a_license() {
        let response = app(state().await, test_dist())
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/reports")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"schema":"screenreader-task-audit/v1","tasks":[]}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);
    }
    #[tokio::test]
    async fn claim_backend_report_validation() {
        let state = state().await;
        let valid =
            serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[{},{},{},{},{}]});
        assert!(store_report(&state.db, valid).await.is_ok());
        let too_many =
            serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[{},{},{},{},{},{}]});
        assert_eq!(
            validate_report(&too_many).unwrap_err().status,
            StatusCode::BAD_REQUEST
        );

        let template =
            serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[],"padding":""});
        let base = serde_json::to_string(&template).unwrap().len();
        let exact = serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[],"padding":"x".repeat(200_000 - base)});
        assert_eq!(serde_json::to_string(&exact).unwrap().len(), 200_000);
        assert!(store_report(&state.db, exact).await.is_ok());
        let over = serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[],"padding":"x".repeat(200_001 - base)});
        assert_eq!(serde_json::to_string(&over).unwrap().len(), 200_001);
        assert_eq!(
            store_report(&state.db, over).await.unwrap_err().status,
            StatusCode::BAD_REQUEST
        );
    }
    #[tokio::test]
    async fn limiter_blocks_the_41st_request_with_retry_after() {
        let app = app(state().await, test_dist());
        for request_number in 1..=41 {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .uri("/api/reports/missing")
                        .header("x-forwarded-for", "203.0.113.9")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            if request_number <= 40 {
                assert_eq!(
                    response.status(),
                    StatusCode::NOT_FOUND,
                    "request {request_number} should remain inside the burst allowance"
                );
            } else {
                assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
                assert_eq!(response.headers().get(header::RETRY_AFTER).unwrap(), "1");
            }
        }
    }

    #[tokio::test]
    async fn claim_backend_rate_limit() {
        let db_path = std::env::temp_dir().join(format!(
            "screenreader-task-audit-rate-{}.db",
            Uuid::new_v4()
        ));
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
        let options = SqliteConnectOptions::from_str(&db_url)
            .unwrap()
            .create_if_missing(true)
            .busy_timeout(Duration::from_secs(5));
        let db_one = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options.clone())
            .await
            .unwrap();
        initialize_database(&db_one).await.unwrap();
        let db_two = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await
            .unwrap();
        let state_one = AppState {
            db: db_one.clone(),
            build_sha: "instance-one".into(),
            rate_cleanup_after: Arc::new(AtomicI64::new(i64::MAX)),
            http: reqwest::Client::new(),
        };
        let state_two = AppState {
            db: db_two.clone(),
            build_sha: "instance-two".into(),
            rate_cleanup_after: Arc::new(AtomicI64::new(i64::MAX)),
            http: reqwest::Client::new(),
        };
        let apps = [app(state_one, test_dist()), app(state_two, test_dist())];
        let mut jobs = tokio::task::JoinSet::new();
        for request_number in 0..100 {
            let app = apps[request_number % apps.len()].clone();
            jobs.spawn(async move {
                app.oneshot(
                    Request::builder()
                        .uri("/api/reports/not-a-valid-id")
                        .header("x-forwarded-for", "198.51.100.82")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap()
            });
        }
        let mut normal = 0;
        let mut limited = 0;
        while let Some(response) = jobs.join_next().await {
            let response = response.unwrap();
            match response.status() {
                StatusCode::NOT_FOUND => normal += 1,
                StatusCode::TOO_MANY_REQUESTS => {
                    assert_eq!(response.headers().get(header::RETRY_AFTER).unwrap(), "1");
                    limited += 1;
                }
                status => panic!("unexpected burst response: {status}"),
            }
        }
        assert_eq!(normal, 40);
        assert_eq!(limited, 60);

        tokio::time::sleep(Duration::from_millis(1_050)).await;
        let recovered = apps[0]
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/reports/not-a-valid-id")
                    .header("x-forwarded-for", "198.51.100.82")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(recovered.status(), StatusCode::NOT_FOUND);

        db_one.close().await;
        db_two.close().await;
        std::fs::remove_file(db_path).unwrap();
    }

    #[tokio::test]
    async fn durable_volume_sqlite_uses_a_rollback_journal_and_one_connection() {
        let db_path = std::env::temp_dir().join(format!(
            "screenreader-task-audit-durable-{}.db",
            Uuid::new_v4()
        ));
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
        let db = SqlitePoolOptions::new()
            .max_connections(DURABLE_SQLITE_CONNECTIONS)
            .connect_with(durable_sqlite_options(&db_url).unwrap())
            .await
            .unwrap();
        let journal_mode: String = sqlx::query_scalar("PRAGMA journal_mode")
            .fetch_one(&db)
            .await
            .unwrap();
        assert_eq!(DURABLE_SQLITE_CONNECTIONS, 1);
        assert_eq!(journal_mode, "delete");
        db.close().await;
        std::fs::remove_file(db_path).unwrap();
    }

    #[test]
    fn sqlite_limiter_deployment_is_pinned_to_one_replica() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(".factory/container-scale.json");
        let config: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
        assert_eq!(config.get("minReplicas").and_then(Value::as_u64), Some(1));
        assert_eq!(config.get("maxReplicas").and_then(Value::as_u64), Some(1));
        assert_eq!(
            config
                .pointer("/persistentVolume/name")
                .and_then(Value::as_str),
            Some("audit-data")
        );
        assert_eq!(
            config
                .pointer("/persistentVolume/storageName")
                .and_then(Value::as_str),
            Some("screenreader-task-audit-data")
        );
        assert_eq!(
            config
                .pointer("/persistentVolume/storageType")
                .and_then(Value::as_str),
            Some("AzureFile")
        );
        assert_eq!(
            config
                .pointer("/persistentVolume/mountPath")
                .and_then(Value::as_str),
            Some("/app/data")
        );
    }

    #[tokio::test]
    async fn documented_spa_routes_direct_load_and_reload_with_ok_status() {
        let app = app(state().await, test_dist());
        for path in [
            "/demo",
            "/audit",
            "/privacy",
            "/terms",
            "/report",
            "/demo/report",
            "/share/0123456789abcdef0123456789abcdef",
        ] {
            for _ in 0..2 {
                let response = app
                    .clone()
                    .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
                    .await
                    .unwrap();
                assert_eq!(
                    response.status(),
                    StatusCode::OK,
                    "{path} should be a direct-loadable document"
                );
                assert_eq!(
                    response.headers().get(header::CACHE_CONTROL).unwrap(),
                    "no-cache"
                );
                let body = to_bytes(response.into_body(), 1024).await.unwrap();
                assert!(String::from_utf8_lossy(&body).contains("application shell"));
            }
        }
    }

    #[tokio::test]
    async fn unknown_paths_are_a_real_404_and_assets_are_immutable() {
        let app = app(state().await, test_dist());
        let missing = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/not-a-route")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(missing.status(), StatusCode::NOT_FOUND);
        assert_eq!(
            missing.headers().get(header::CACHE_CONTROL).unwrap(),
            "no-cache"
        );
        let asset = app
            .oneshot(
                Request::builder()
                    .uri("/assets/app-123.js")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(asset.status(), StatusCode::OK);
        assert_eq!(
            asset.headers().get(header::CACHE_CONTROL).unwrap(),
            "public, max-age=31536000, immutable"
        );
    }
}
