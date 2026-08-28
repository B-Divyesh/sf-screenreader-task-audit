# Screenreader Task Audit — build handoff

## Independent QA status — FAIL (2026-08-28)

**Candidate:** `175ef58655edffdb2f6cdc92544531e2e89925b0`
**Deployment:** https://screenreader-task-audit.sociobot.in

This handoff is superseded by independent verification in [`.factory/verification.md`](verification.md). **Do not release this candidate.** The deployed and locally built release server return HTTP 404 for direct SPA routes: `/demo`, `/audit`, `/privacy`, `/terms`, and `/demo/report`. The HTML still loads the client app, but Chromium logs a 404 console error for each document. This breaks the required direct `/demo` sandbox entry point, real-route status contract, and no-console-errors quality gate.

All seven listed claim commands passed, as did `npm test`, `cargo test`, `npx tsc --noEmit`, `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo build --release`, and `npm run build`. Live `/health` reports the exact candidate SHA. The verification also confirmed live API rate limiting: a 120-request simultaneous burst allowed 40 and returned 80 `429` responses with `Retry-After: 1`.

Open defects:

- **High / release blocking:** fix SPA fallback status handling and add direct-load/reload production-server tests for every documented route.
- **High / release blocking:** complete `.factory/claims.json` coverage and make `license-unlock` create/open a shared link rather than only asserting button visibility.
- **Medium:** add cache-control policy for fingerprinted assets; live hashed JS/CSS/WebP currently have neither `Cache-Control` nor `ETag`.

The Docker daemon was unavailable in the verifier environment, so the Docker image itself could not be built. The production Vite build and Rust release binary were independently built and run.

## What shipped

- A consent-first local audit for up to five essential screen-reader tasks.
- Structured observations for results, impact, expected steps, announcements, focus, blockers, and notes.
- An optional event trace that records only a time, event type, target, and observation.
- A prioritized report ordered by blocked/partial result and impact.
- Free JSON and standalone accessible HTML exports, with an anonymized option.
- A one-click `/demo` with five realistic analytics tasks, a separate storage key, reset, and offline reload.
- A $39 one-time team tier using the Sociobot checkout and license verification contract.
- Server-side license verification before a shared report is stored.
- Private shared-report URLs backed by SQLite with enforced 30-day expiry.
- `/privacy`, `/terms`, a styled 404 route, per-route titles, canonical metadata, sitemap, robots file, CSP, and security headers.
- A Rust axum server that serves the Vite build, reports its build SHA at `/health`, starts with only `PORT`, and shuts down cleanly.
- Per-IP API rate limiting from the first `X-Forwarded-For` hop. Limits return `429` with `Retry-After: 1`.
- An original generated risograph collage, compressed to 145 KB WebP. Prompt and provenance are in `.factory/design.md` and `assets/src/`.

The product uses no runtime AI because the job needs faithful tester evidence, not generated conclusions.

## How to run

```sh
npm ci
npm run build
cargo run
```

Open `http://localhost:8080/demo`. The container build command is:

```sh
docker build --build-arg BUILD_SHA=$(git rev-parse HEAD) -t screenreader-task-audit .
```

The factory can omit `BUILD_SHA`; it defaults to `dev`. The runtime needs only `PORT`, which defaults to `8080`.

## Verification completed

- `npm test`: passed — 3 Vitest unit tests and 16 Playwright runs across desktop Chromium and a 390 × 844 mobile viewport.
- `cargo test`: passed — 4 backend tests.
- `npx tsc --noEmit`: passed.
- `cargo fmt -- --check`: passed.
- `npm run build`: passed; output is exactly `dist/` with `dist/index.html`.
- Production bundle: 10.09 KB gzip JavaScript, 3.38 KB gzip CSS, 145 KB hero WebP.
- Playwright axe scan: no serious or critical findings on `/`, `/demo`, `/demo/report`, `/privacy`, or `/terms`; light and dark treatments were checked across both viewports.
- Console check: no console errors or uncaught page errors on the same routes.
- Keyboard check: SPA route changes focus and announce the new `h1`.
- Offline check: `/demo` reloads with sample data after the first visit.
- Privacy check: the full demo edit and report flow made no off-origin requests.
- Rate-limit smoke: 100 concurrent requests from one forwarded address returned 40 normal `404` responses and 60 limited `429` responses in 0.5 seconds.
- Default runtime check: server started on port 8080 with no environment variables and logged generated/default configuration without secrets.

Lighthouse 13.4.1 mobile results on the production Vite build:

| Category or metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 2.0 s |
| Cumulative Layout Shift | 0 |
| Total Blocking Time | 10 ms |

Raw Lighthouse evidence is in `.factory/lighthouse.json`. INP is not available in a single-load lab run; keyboard interaction tests complete without timed delays.

## Privacy and storage

- Real audit key: `sra:audit:v1`.
- Demo key: `demo:sra:audit:v1`.
- License key: `sb_license:screenreader-task-audit`.
- Free audit content stays in local storage.
- Only **Create private link** sends the reviewed report to the backend.
- Shared reports use random 128-bit identifiers and expire after 30 days.
- Payment details go only to Sociobot/Dodo. The app never receives card data.

## Known gaps and next steps

- The factory must register and activate the paid product before the checkout URL can sell licenses.
- Docker was not available in this worker, so the image itself was not built here. The frontend production build and release Rust binary were built separately and passed.
- Shared links are capability links. Anyone who receives a link can read it until expiry; the UI says “private” in that specific sense.
- SQLite suits the current single-container deployment. A multi-replica deployment would need shared PostgreSQL storage.
- Real NVDA, JAWS, and VoiceOver sessions remain a pilot activity; automated tests cannot replace lived screen-reader testing.
