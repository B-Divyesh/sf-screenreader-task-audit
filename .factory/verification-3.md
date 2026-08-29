# Independent verification 3 — PASS

**Candidate:** `a549f8a61209ca1e4b0cb4aa3d924968d6cd2ae6`  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Verified:** 2026-08-29 UTC

## Verdict

**PASS — release candidate accepted.** Fresh local and live evidence confirms that the deployed application is this candidate and that the previous deployment-only rate-limit defect is repaired.

`GET /health` returned:

```json
{"status":"ok","build_sha":"a549f8a61209ca1e4b0cb4aa3d924968d6cd2ae6"}
```

The live `index-CJYE8I6A.js` was byte-for-byte identical to a fresh local production build made with `VITE_BUILD_SHA=a549f8a61209ca1e4b0cb4aa3d924968d6cd2ae6`.

## Required cold first read and demo gate

**Pass.** A cold browser load says: “Prove which screen-reader tasks work.” It identifies the audience as “blind founders and small teams,” and the adjacent one-click **Try it with sample data** action says it will show “five filled tasks and a prioritized report.” This meets the plain-words what/who/first-action requirement.

The first screen is preserved at 390 px: document scroll width and viewport width were both 390 px. The demo is available at `/demo`, has the persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start for real.

## Claim-test gate

After `npm ci` from this clean candidate, every exact test command in `.factory/claims.json` passed. Browser claims each passed in Chromium and the 390 × 844 mobile project.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | pass (2/2) |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | pass (2/2) |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock` | pass (2/2) |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | pass (2/2) |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | pass (2/2) |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | pass (2/2) |
| `free-local-storage` | `npm run test:e2e -- --grep @claim:free-local-storage` | pass (2/2) |
| `hosted-checkout` | `npm run test:e2e -- --grep @claim:hosted-checkout` | pass (2/2) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | pass (2/2) |
| `shared-expiry` | `cargo test claim_shared_links_expire_after_30_days` | pass (1/1) |

## Local build and backend checks

- `npm run build`: passed and emitted `dist/`. Initial JS was 31.61 KB / 10.13 KB gzip; CSS was 10.66 KB / 3.38 KB gzip. Both are within the static budget.
- `npm test`: passed — 3 Vitest tests and 22 Playwright tests.
- `npx tsc --noEmit`, `cargo fmt -- --check`, `cargo test` (7/7), and `cargo clippy --all-targets -- -D warnings`: passed.
- `cargo build --release`: passed. The resulting release binary started with only `PORT=8081` supplied, logged its default data configuration without a secret requirement, returned `200` from `/health` and `/demo`, and returned a real `404` for an unknown route.
- Docker is not installed in this disposable verification container, so a local image build could not be run. The root Dockerfile was inspected and the release binary build/run was exercised.

## Live functional, privacy, and accessibility checks

- Normal flow: created a consented local audit, edited task evidence, received “Saved in this browser,” and found the data only in `sra:audit:v1`. Empty setup was blocked with the recovery message “Fill every field and confirm the tester’s consent.”
- Demo flow: a changed task was written only to `demo:sra:audit:v1`; `sra:audit:v1` stayed absent; Reset restored “Change the report date range.” After service-worker activation/update, `/demo` reloaded offline with the offline notice and “August analytics check.”
- Request capture throughout a cold load, demo flow, and real local-audit flow observed only same-origin app requests. There were no analytics, CDN fonts, third-party scripts, or free-audit API writes.
- Playwright Axe scans on `/`, `/demo`, `/demo/report`, `/privacy`, and `/terms` found zero serious or critical violations. No console errors or page errors were recorded.
- Keyboard smoke passed: the first Tab focused the visible skip link (3 px cobalt outline), Enter focused `main`, and keyboard navigation to Demo moved focus to its `h1`. Reduced motion reduced transition and animation duration to `0.01ms`.
- Live Lighthouse mobile on `/demo`: **97 performance**, **100 accessibility**; FCP 1.39 s, LCP 1.52 s, CLS 0, TBT 196 ms.
- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/service-worker.js` returned 200; an unknown route returned 404. HTML and service worker use `Cache-Control: no-cache`; fingerprinted JS uses `public, max-age=31536000, immutable`.
- Response headers included CSP with response-header `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- The live rate limiter now enforces the documented allowance. One initial request plus a 100-request concurrent burst from fixed `X-Forwarded-For: 198.51.100.211` produced **39 × 404 and 61 × 429**: exactly 40 allowed requests including the initial probe. Limited responses contained `Retry-After: 1`; after two idle seconds, the same client again received 404. This replaces the failed previous live verification.
- Invalid backend inputs recover safely: an unlicensed report POST returned `402` and `{"error":"A team-sharing license is required."}`; an oversized request returned `413`.

## Defects by severity

### Critical / high

None found.

### Medium — operational persistence boundary, not release-blocking for the current singleton deployment

Shared reports and rate-limit state are SQLite files under `/app/data`. This repository cannot establish whether the factory environment mounts that directory durably across a container replacement. A replacement could remove a paid private report before its 30-day application expiry. Keep the documented single-replica boundary and add a durable single-writer volume or shared database before offering durability across restarts or multiple replicas.

### Low

None found.

## Re-run

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
