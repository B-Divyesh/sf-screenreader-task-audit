# Screenreader Task Audit — repair handoff

## Release status

**Repaired candidate:** commit recorded below after the repair commit is created.

This repair resolves every finding in the independent verification for candidate `175ef58655edffdb2f6cdc92544531e2e89925b0`.

- Documented app routes now return **200** with the application shell on direct navigation and reload: `/`, `/demo`, `/audit`, `/privacy`, `/terms`, `/report`, `/demo/report`, and `/share/<id>`.
- Unknown paths retain a real, styled **404** response.
- Fingerprinted `/assets/*` now use `Cache-Control: public, max-age=31536000, immutable`; HTML and `/service-worker.js` use `Cache-Control: no-cache`.
- The claim contract now covers JSON export, anonymized export, free local storage/no off-origin transmission, hosted $39 checkout terms, and a real create-and-open sharing flow. The sharing flow also succeeds when clipboard permission is denied and shows the link for manual copying.

## What is shipped

- A consent-first local audit for up to five essential screen-reader tasks.
- Structured observations, a prioritized report, free JSON and accessible HTML exports, and an anonymized export option.
- A one-click `/demo` with five realistic analytics tasks, separate demo storage, reset, and offline reload.
- $39 one-time team sharing through Sociobot/Dodo; server-side license checks; 128-bit capability links that expire after 30 days.
- Privacy and terms pages, a generated original risograph collage, security headers, local-first storage, and no runtime analytics or third-party fonts.
- A Rust/Axum server, SQLite shared-report storage, `/health`, graceful shutdown, and per-forwarded-IP API limits with `429` and `Retry-After: 1`.

## Run and deploy

```sh
npm ci
npm run build
cargo run
```

Open `http://localhost:8080/demo`. The production image is built from the root `Dockerfile`; it needs only `PORT` (default `8080`). `BUILD_SHA` is optional and labels `/health`. The factory deployment targets the existing Container App `sf-screenreader-task-audit` in resource group `sociobot`.

## Verification evidence

Completed in this repair workspace on 2026-08-28 UTC:

- `npm ci` completed (61 packages). `npm audit --omit=dev` found **0** production vulnerabilities.
- `npm test` passed: **3 Vitest** tests and **22 Playwright** runs across desktop Chromium and a 390 × 844 touch viewport.
- `npx tsc --noEmit`, `cargo test` (**6** tests), `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo build --release` all passed.
- Rust regression coverage directly loads and reloads every documented SPA route twice from a production-style static directory, asserts 200 and shell content, asserts unknown-route 404, and asserts both cache policies.
- The release binary was started with only `PORT=8081`. Curl confirmed every documented route returned 200, an unknown route returned 404, HTML used `no-cache`, and a hashed asset used the immutable cache policy. Its startup log reported `configuration loaded; no secret configuration required`.
- A release-binary Playwright smoke passed for desktop and 390 px mobile across `/demo`, `/audit`, `/privacy`, `/terms`, `/report`, and `/demo/report`: each response was 200, each page had exactly one `main` and `h1`, and there were no console or page errors.
- Playwright's existing axe scans passed with no serious or critical findings across landing, demo, report, privacy, and terms in light and dark modes. The suite also covers keyboard route focus, reduced motion, form recovery, offline demo reload, and same-origin local-storage behavior.
- Every `.factory/claims.json` command is represented by a tagged sandbox test; the full suite passed. The strengthened `@claim:license-unlock` test creates a mocked licensed report, verifies its request body, then opens the created URL in a clean browser context with no authorization header.
- Current release-binary Lighthouse mobile run: **100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.08 s; CLS 0**. Raw output: [`.factory/lighthouse.json`](lighthouse.json). Lighthouse used the pinned Playwright Chromium with `--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu`.
- Docker CLI is not installed in this worker, so no local image build was possible. The Dockerfile contract is exercised by the ACR build during deployment (record deployment evidence below after it completes).

## Storage and privacy

- Real audit key: `sra:audit:v1`; demo key: `demo:sra:audit:v1`; license key: `sb_license:screenreader-task-audit`.
- Free audit content stays in browser storage. It reaches the server only when a licensed user selects **Create private link**.
- SQLite retains shared copies for 30 days. Anyone with a shared capability URL can read it until expiry; the UI states this clearly.

## Known operational notes

- The paid product must remain registered and active in Sociobot for checkout to sell licenses.
- SQLite is appropriate for this single-container deployment. Multiple replicas would need shared durable storage.
- Automated checks complement, but do not replace, testing with NVDA, JAWS, and VoiceOver users.
