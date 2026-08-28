use axum::{
    body::Body,
    extract::{Path, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use dashmap::DashMap;
use serde::Serialize;
use serde_json::Value;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::{
    collections::VecDeque,
    env,
    net::SocketAddr,
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::signal;
use tower_http::{
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    build_sha: String,
    rate: Arc<DashMap<String, VecDeque<Instant>>>,
    http: reqwest::Client,
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    build_sha: String,
}

#[derive(Serialize)]
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
    let now = Instant::now();
    let mut hits = state.rate.entry(key).or_default();
    while hits
        .front()
        .is_some_and(|at| now.duration_since(*at) > Duration::from_secs(1))
    {
        hits.pop_front();
    }
    if hits.len() >= 40 {
        let mut response = (
            StatusCode::TOO_MANY_REQUESTS,
            Json(serde_json::json!({"error":"Too many requests. Try again in one second."})),
        )
            .into_response();
        response
            .headers_mut()
            .insert(header::RETRY_AFTER, HeaderValue::from_static("1"));
        return response;
    }
    hits.push_back(now);
    drop(hits);
    next.run(request).await
}

async fn security_headers(request: Request, next: Next) -> Response {
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
    response
}

fn app(state: AppState, dist: PathBuf) -> Router {
    let api = Router::new()
        .route("/reports", post(create_report))
        .route("/reports/{id}", get(get_report))
        .layer(RequestBodyLimitLayer::new(220_000))
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit));
    let fallback = ServeDir::new(&dist).not_found_service(ServeFile::new(dist.join("index.html")));
    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        .fallback_service(fallback)
        .layer(middleware::from_fn(security_headers))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let build_sha = env::var("BUILD_SHA").unwrap_or_else(|_| "dev".into());
    let data_dir = env::var("DATA_DIR").unwrap_or_else(|_| "data".into());
    std::fs::create_dir_all(&data_dir)?;
    let db_url = format!("sqlite://{data_dir}/reports.db?mode=rwc");
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    sqlx::query("CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, report TEXT NOT NULL, expires_at INTEGER NOT NULL)").execute(&db).await?;
    sqlx::query("DELETE FROM reports WHERE expires_at <= ?")
        .bind(chrono::Utc::now().timestamp())
        .execute(&db)
        .await?;
    tracing::info!(port, %build_sha, data_dir, "configuration loaded; no secret configuration required");
    let state = AppState {
        db,
        build_sha,
        rate: Arc::new(DashMap::new()),
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
    use axum::{body::to_bytes, http::Request};
    use tower::ServiceExt;

    async fn state() -> AppState {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::query("CREATE TABLE reports (id TEXT PRIMARY KEY, report TEXT NOT NULL, expires_at INTEGER NOT NULL)").execute(&db).await.unwrap();
        AppState {
            db,
            build_sha: "test-sha".into(),
            rate: Arc::new(DashMap::new()),
            http: reqwest::Client::new(),
        }
    }
    #[tokio::test]
    async fn health_returns_build_sha() {
        let response = app(state().await, PathBuf::from("dist"))
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
        let response = app(state().await, PathBuf::from("dist"))
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/reports")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"schema":"screenreader-task-audit/v1","tasks":[]}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);
    }
    #[tokio::test]
    async fn claim_shared_links_expire_after_30_days() {
        let state = state().await;
        let body = serde_json::json!({"schema":"screenreader-task-audit/v1","tasks":[]});
        let (_, Json(made)) = store_report(&state.db, body).await.unwrap();
        let expires = chrono::DateTime::parse_from_rfc3339(&made.expires_at)
            .unwrap()
            .timestamp();
        let remaining = expires - chrono::Utc::now().timestamp();
        assert!((2_591_995..=2_592_005).contains(&remaining));
        let response = app(state, PathBuf::from("dist"))
            .oneshot(
                Request::builder()
                    .uri(format!("/api/reports/{}", made.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
    #[tokio::test]
    async fn limiter_returns_retry_after() {
        let app = app(state().await, PathBuf::from("dist"));
        let mut limited = None;
        for _ in 0..45 {
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
            if response.status() == StatusCode::TOO_MANY_REQUESTS {
                limited = Some(response);
                break;
            }
        }
        let response = limited.expect("burst should be limited");
        assert_eq!(response.headers().get("retry-after").unwrap(), "1");
    }
}
