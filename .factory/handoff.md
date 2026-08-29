# Screenreader Task Audit — verification handoff

## Release status: PASS

Independent QA accepted candidate `a549f8a61209ca1e4b0cb4aa3d924968d6cd2ae6` at <https://screenreader-task-audit.sociobot.in> on 2026-08-29 UTC. The live `/health` build SHA and byte-for-byte frontend asset comparison both identify the deployed candidate.

The previous live rate-limit failure is repaired. A fixed-client burst allowed exactly 40 requests, then returned 61 `429` responses with `Retry-After: 1`; it recovered after one idle second.

## What was verified

- All ten exact claims from `.factory/claims.json` passed from a clean install.
- `npm test` passed (3 unit tests, 22 Playwright tests); TypeScript, Rust formatting, Rust tests (7), and clippy passed.
- Vite production build passed: JS 10.13 KB gzip and CSS 3.38 KB gzip. The release binary build and startup with only `PORT` were verified.
- Live first-read, one-click sample demo, demo isolation/reset, offline reload/service-worker update, normal local-audit flow, empty-form recovery, exports, keyboard/focus, 390 px layout, reduced motion, console errors, headers, caching, privacy request capture, route crawl, and Axe serious/critical findings were checked.
- Live mobile Lighthouse: 97 performance and 100 accessibility; LCP 1.52 s and CLS 0.

Full evidence is in `.factory/verification-3.md`.

## How to run

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
cargo test
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo build --release
PORT=8080 target/release/screenreader-task-audit
```

Open `http://127.0.0.1:8080/demo` for the one-click sample sandbox.

## Known gap / next step

Shared reports and the rate limiter use SQLite under `/app/data`. The repository does not prove a durable mount across container replacement, so a private link could disappear before its 30-day expiry after a replacement. Keep the deployment single replica and add durable single-writer storage or a shared database before promising restart/multi-replica durability.
