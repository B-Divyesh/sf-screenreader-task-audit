# Independent verification 5 — PASS

**Candidate:** `22af7fb37fd1fb923f3cbbee65aaf3d8d68d5a71`  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Verified:** 2026-08-29  
**Decision:** **PASS** — no release-blocking defects found.

## Cold first read

On a fresh desktop visit, the first screen plainly says “Record screen-reader
task evidence”, names “blind founders and small teams fixing a critical
dashboard task”, and offers the visible one-click action **Try it with sample
data** with the outcome “See five filled tasks and a prioritized report.” It
also gives three short facts: local browser storage, offline demo support, and
the five-task limit. This satisfies the plain-words and demo-entry contract.

## Mandatory claim checks

`npm ci` completed with zero reported vulnerabilities. Every command declared
in `.factory/claims.json` was run from this checkout against the product demo
entry point. Browser commands ran in both configured Chromium projects
(desktop and 390 px mobile); each passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| demo-sandbox | `npm run test:e2e -- --grep @claim:demo-sandbox` | pass (2) |
| core-workflow | `npm run test:e2e -- --grep @claim:core-workflow` | pass (2) |
| structured-capture | `npm run test:e2e -- --grep @claim:structured-capture` | pass (2) |
| five-tasks | `npm run test:e2e -- --grep @claim:five-tasks` | pass (2) |
| report-priority | `npm run test:e2e -- --grep @claim:report-priority` | pass (2) |
| html-export | `npm run test:e2e -- --grep @claim:html-export` | pass (2) |
| json-export | `npm run test:e2e -- --grep @claim:json-export` | pass (2) |
| anonymous-export | `npm run test:e2e -- --grep @claim:anonymous-export` | pass (2) |
| import-json | `npm run test:e2e -- --grep @claim:import-json` | pass (2) |
| privacy-boundaries | `npm run test:e2e -- --grep @claim:privacy-boundaries` | pass (2) |
| offline-reload | `npm run test:e2e -- --grep @claim:offline-reload` | pass (2) |
| manual-evidence-not-certification | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | pass (2) |
| backend-rate-limit | `cargo test claim_backend_rate_limit` | pass |
| backend-report-validation | `cargo test claim_backend_report_validation` | pass |

## Local quality gates

- `npm test`: pass — 3 Vitest unit tests and 30 Playwright tests.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass. Production bundle: 10.12 KB gzip JavaScript and
  3.42 KB gzip CSS, well below the static-product budgets.
- `cargo test`: pass — 7 tests, including API validation, route status,
  caching, health identity, license boundary, and limiter recovery.
- `cargo fmt -- --check` and `cargo clippy --all-targets -- -D warnings`:
  pass.
- `cargo build --release`: pass.
- The production Docker build could not be executed because `docker` is not
  installed in this disposable verifier container. Static review confirms the
  root Dockerfile is multi-stage, uses `rust:1-alpine`, accepts `BUILD_SHA`,
  runs non-root, and serves `PORT`. The release binary also started with no
  secret configuration; on `PORT=18080`, `/health` returned `dev`, its
  startup log reported no secret configuration required, and its 41st API
  request returned `429` with `Retry-After: 1`.

## Live deployment evidence

- `GET /health` returned
  `{"status":"ok","build_sha":"22af7fb37fd1fb923f3cbbee65aaf3d8d68d5a71"}`.
- Building the checkout with `VITE_BUILD_SHA` set to that SHA produced
  `index-CDN5JXhD.js`; its SHA-256 exactly matches the deployed asset:
  `10ce0d72adfe447330fd6c59c9f04919f771d16dceb28289eb2b4ff6d26377c0`.
- `npm run verify:live-rate-limit`: requests 1–40 for one forwarded address
  returned 404; request 41 returned 429 with `Retry-After: 1`. Observed
  allowance: **40 requests per forwarded client address, reset after one idle
  second**.
- A live representative audit was created with consent, a blocked task and
  observations were recorded, then it was reviewed in the report. Empty setup
  correctly announced: “Fill every field and confirm the tester’s consent.”
  The five-task sample disables Add task at the limit; the import/export,
  anonymization, trace-event, reset, and offline recovery paths are covered by
  the claim tests above.
- Live Playwright axe scans on `/`, `/demo`, `/demo/report`, `/audit`,
  `/report`, `/privacy`, `/terms`, and `/missing` found **0 serious or
  critical** violations. Public application routes produced no console or page
  errors. Intentional direct navigation to `/missing` produces the browser’s
  expected failed-resource message because the designed page correctly returns
  404; it is not emitted on public application pages.
- Keyboard smoke test passed: Tab reaches the skip link, its designed focus
  ring is a 3 px `#1559d6` outline with 3 px offset, Enter focuses
  `<main>`, and route changes focus the new heading. At 390 px, document
  width remained exactly 390 px with the demo banner and all task controls.
- Service worker activation, explicit `registration.update()`, controlled
  reload, and offline reload of `/demo` passed. Offline showed the expected
  notice and sample audit.
- Privacy request log across the landing page, demo, audit creation, report,
  privacy and terms recorded 31 requests, all same-origin and no `/api/`
  calls. No analytics, ads, capture calls, or external runtime requests were
  observed.
- Headers on shell and assets include CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and
  camera/microphone/geolocation permissions disabled. HTML and service worker
  use `Cache-Control: no-cache`; hashed assets use
  `public, max-age=31536000, immutable`.
- Independent Lighthouse mobile run on `/demo`: Performance **98**,
  Accessibility **100**, Best Practices **100**, SEO **100**; LCP 1.3 s,
  CLS 0, TBT 180 ms.

## Defects by severity

No Critical, High, Medium, or Low product defects found. The unavailable local
Docker CLI is an environment limitation, not evidence of a product failure.
