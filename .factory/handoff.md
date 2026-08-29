# Screenreader Task Audit — repair handoff

## Release status

- Repair work order: `screenreader-task-audit-repair-2`
- Verifier report: commit `07c10854d9a1f4654067e0e9b1dc6437a8b59594`
- Failed candidate: `e74605ff3597045cb66fa39e5daf231336bdd831`
- Repaired candidate: `923255746368a84593221345731f7c3178e25417`
- Live revision: `sf-screenreader-task-audit--0000005`

The release-blocking live rate-limit finding is repaired. The earlier direct-route, claim-coverage, and cache-policy repairs remain covered and passing.

## Root cause and repair

The failed candidate kept request history in a process-local `DashMap`, while the live Container App allowed up to three replicas. Each replica could therefore grant a separate allowance, and topology changes could make a live burst miss the expected boundary.

- API limiting now uses an atomic SQLite burst counter: one 40-request burst per first `X-Forwarded-For` address, reset only after one idle second.
- The limiter and shared reports use the same database. A single atomic upsert prevents separate server processes that share that database from granting separate allowances.
- Rejected requests return `429`, JSON recovery text, and `Retry-After: 1`. Database errors fail closed with `503` instead of silently bypassing the policy.
- Expired limiter rows are cleaned hourly. SQLite uses WAL mode, normal synchronization, and a five-second busy timeout to keep the limiter responsive under a burst.
- The deployment is kept at one replica because its report store is single-writer SQLite. README now makes that boundary explicit.
- Regression `limiter_is_atomic_across_instances_for_the_verifiers_exact_burst` sends 100 concurrent requests through two independent app instances connected to one database and proves exactly 40 normal / 60 limited responses, then proves recovery after an idle second. The existing response regression proves `429` and `Retry-After: 1` through the Axum router.
- Playwright can now run unchanged against the real release server via `PLAYWRIGHT_BASE_URL`. Its privacy assertion derives the configured product origin instead of hard-coding Vite's preview port.
- Vite was updated to 7.3.6 and Vitest to 3.2.7 to clear current development-tool advisories. Playwright remains pinned to 1.58.2.
- The Docker Rust builder now follows the required `rust:1-alpine` stable tag.

## Local verification — 2026-08-29 UTC

- `npm ci`: clean install, 59 packages.
- `npm audit`: 0 vulnerabilities, including development dependencies.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and produced `dist/`; initial JS 31.46 KB / 10.09 KB gzip, CSS 10.66 KB / 3.38 KB gzip.
- `npm test`: passed: 3 Vitest tests and 22 Playwright runs across desktop Chromium and a 390 × 844 touch viewport.
- Every exact command in `.factory/claims.json` passed independently: nine Playwright claims passed on both browser projects and the 30-day Rust claim passed.
- `cargo test`: 7 passed, including the new cross-instance rate-limit regression.
- `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo build --release`: passed.
- The release binary started in a clean temporary directory with only `PORT=8081`; startup reported that no secret configuration was required.
- Direct release-server requests returned 200 for `/`, `/demo`, `/audit`, `/privacy`, `/terms`, `/report`, `/demo/report`, `/share/<id>`, `/robots.txt`, and `/sitemap.xml`; an unknown path returned 404.
- Release-server HTML and the service worker use `Cache-Control: no-cache`; hashed assets use `public, max-age=31536000, immutable`. CSP, `nosniff`, referrer policy, and permissions policy were present.
- The complete 22-test Playwright suite passed against the Rust release server on desktop and 390 px mobile. It covers one `h1`/`main`, no console errors, keyboard route focus, form recovery, same-origin privacy, demo isolation/reset, offline update/reload, reduced motion, and Axe serious/critical scans in light and dark treatments.
- A release-server burst returned limited responses and a follow-up `429` with `Retry-After: 1` plus the documented JSON error. No slow-query warning was emitted after WAL tuning.
- Current live Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s; CLS 0; total transfer 44 KiB. Raw evidence: `.factory/lighthouse.json`.
- `git diff --check`: passed.

## Build and live verification — 2026-08-29 UTC

- Azure Container Registry build `chup` built the `.git`-excluded source archive successfully with the root Dockerfile. Image digest: `sha256:aba23a1a4da9a0b422d06de98a908ea0c5f14fb75b2a78cb7e4b2306eaeb08d1`.
- Container App revision `sf-screenreader-task-audit--0000005` serves that immutable digest with 100% traffic, `minReplicas: 1`, and `maxReplicas: 1`. Live `/health` returns the full repaired candidate SHA.
- The verifier's exact fixed-client patterns now enforce one allowance: 50 sequential requests returned 40 × 404 and 10 × 429; 100 concurrent returned 40 × 404 and 60 × 429; 400 requests at concurrency 100 returned 40 × 404 and 360 × 429. Every limited response included `Retry-After: 1`. An ordinary request after one idle second returned 404.
- The complete 22-test Playwright suite passed unchanged against the live HTTPS URL on desktop and 390 × 844 mobile. This includes every browser claim, offline reload/update, privacy request capture, demo isolation/reset, keyboard focus, reduced motion, legal routes, console monitoring, and Axe scans.
- The factory URL verifier passed live `/demo`: title `Demo — Screenreader Task Audit`, `lang="en"`, one `h1`, a `main` landmark, zero images missing alt text, zero unlabeled buttons, and no console errors.
- Direct live checks returned 200 for `/`, `/demo`, `/audit`, `/privacy`, `/terms`, `/report`, `/demo/report`, `/share/<id>`, `/robots.txt`, and `/sitemap.xml`; an unknown route returned 404. HTML uses `no-cache`; fingerprinted assets use `public, max-age=31536000, immutable`; CSP, `nosniff`, referrer policy, and permissions policy are present.

## Run and verify

```sh
npm ci
npm audit
npm test
npx tsc --noEmit
npm run build
cargo test
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo build --release
PORT=8080 target/release/screenreader-task-audit
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

Open `http://127.0.0.1:8080/demo`. The production image is built from the root `Dockerfile`, runs as a non-root user, and needs only `PORT`.

## Storage and privacy

- Real audit key: `sra:audit:v1`; demo key: `demo:sra:audit:v1`; license key: `sb_license:screenreader-task-audit`.
- Free and demo audit content stays in browser storage. It reaches the server only when a licensed user chooses **Create private link**.
- Shared reports and limiter state use SQLite under `DATA_DIR`; links have application-level 30-day expiry.
- No analytics, CDN font, or third-party runtime script is present. Payment and license checks use only the documented Sociobot endpoints.

## Known operational boundary

The current factory deployment does not mount durable storage. A container replacement can therefore remove shared report copies before their application-level 30-day expiry. Keep the deployment at one replica, and add a durable single-writer volume or migrate reports and limiter state to a shared database before enabling multiple replicas. This was recorded by the verifier as a non-release finding and is unchanged by this scoped repair.

Automated checks complement, but do not replace, testing with NVDA, JAWS, and VoiceOver users.
