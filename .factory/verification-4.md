# Independent verification 4 — FAIL

**Candidate:** `53f9247c104641aabef42d4a0c601d5f5ff53cb9`
**Live URL:** <https://screenreader-task-audit.sociobot.in>
**Verified:** 2026-08-29 UTC

## Verdict

**FAIL — do not release.** The deployed API does not enforce its documented 40-request allowance, and the supposedly isolated demo reads or creates the real-audit storage key. Both are mandatory acceptance boundaries.

The failure is not a stale-deployment result. `/health` returned the candidate SHA, and fresh local candidate builds produced HTML, JavaScript, and CSS that were byte-for-byte identical to the live files.

## Required first-read and demo gate

**First-read: pass.** A cold page says **“Record screen-reader task evidence,”** identifies **“blind founders and small teams fixing a critical dashboard task,”** and makes **“Try it with sample data”** the clear first action. Its adjacent text says the click shows five filled tasks and a prioritized report.

**One-click sample: pass.** The action opens the populated August analytics audit with five tasks and the persistent demo banner.

**Demo isolation: fail.** Storage instrumentation on a fresh direct `/demo` load observed:

```text
get sra:audit:v1
set sra:audit:v1
get demo:sra:audit:v1
set demo:sra:audit:v1
```

The product created a blank real audit while showing “Demo — sample data, nothing is saved.” With a valid existing real audit, the direct demo load still read `sra:audit:v1` before loading the demo key. The existing value was not displayed or changed, but the demo contract explicitly forbids reading or writing the real namespace. The cause is the eager `loadAudit(false)` at module initialization.

## Claims gate

After `npm ci`, every exact command in `.factory/claims.json` completed successfully. Each browser command ran in desktop Chromium and the 390 × 844 mobile project.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | pass (2/2) |
| `core-workflow` | `npm run test:e2e -- --grep @claim:core-workflow` | pass (2/2) |
| `structured-capture` | `npm run test:e2e -- --grep @claim:structured-capture` | pass (2/2) |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | pass (2/2) |
| `report-priority` | `npm run test:e2e -- --grep @claim:report-priority` | pass (2/2) |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | pass (2/2) |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | pass (2/2) |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | pass (2/2) |
| `import-json` | `npm run test:e2e -- --grep @claim:import-json` | pass (2/2) |
| `privacy-boundaries` | `npm run test:e2e -- --grep @claim:privacy-boundaries` | pass (2/2) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | pass (2/2) |
| `manual-evidence-not-certification` | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | pass (2/2) |
| `backend-rate-limit` | `cargo test claim_backend_rate_limit` | pass (1/1, local only) |
| `backend-report-validation` | `cargo test claim_backend_report_validation` | pass (1/1, internal boundary test) |

The green `demo-sandbox` test misses the isolation defect because it creates a real audit before entering demo mode and checks only that its value survives. It does not instrument access to the real key or assert that a fresh direct demo leaves the real key absent.

## Live deployment identity and backend

- `/health` returned `{"status":"ok","build_sha":"53f9247c104641aabef42d4a0c601d5f5ff53cb9"}` on 20/20 checks.
- Fresh candidate and live SHA-256 values matched for `index.html`, `index-3mreSnNI.js`, and `index-C594mjbP.css`.
- Known document routes returned 200; `/missing` returned a real 404.
- Invalid JSON returned 400, a valid-shaped report without a license returned 402, and a 230 KB body returned 413.
- The release binary started with only `PORT=18080`, logged that no secret configuration was required, served the app, and shut down cleanly.
- Local rate-limit evidence was correct: 70 sequential requests from one forwarded address produced 40 × 404 then 30 × 429; the limited response included `Retry-After: 1`.
- **Live rate-limit evidence failed:** a fresh 100-request concurrent burst from one forwarded address produced 100 × 404 and 0 × 429. Separate 70-request sequential runs produced 70 × 404 and 0 × 429 both with and without a supplied `X-Forwarded-For`. The observed live allowance is therefore at least 100, not the documented 40, and no `Retry-After` could be observed because no request was limited.

## End-to-end product behavior

- `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e`: 30/30 passed.
- A separate normal-case run created a consented audit, recorded a critical blocker and trace event, reloaded, and found the evidence in the prioritized report.
- Empty setup produced “Fill every field and confirm the tester’s consent” and focused the first invalid field. An empty trace event focused its required observation field; valid recovery produced “Trace event recorded.”
- An 80-character audit name persisted across reload. The fifth task was accepted and the sixth-task action was disabled. Canceling deletion preserved five tasks; confirming it left four.
- Route navigation and browser Back moved focus to the destination `h1`.
- JSON, anonymized JSON, accessible HTML, import confirmation, invalid import rejection, priority ordering, reset, and discard-on-leave all passed their observable browser tests.

## Accessibility, privacy, PWA, and responsive checks

- `/opt/fleet/lib/verify-url.sh` passed: title, `lang=en`, one `h1`, `main`, image alternatives, labeled buttons, and zero console errors. Evidence is under `.factory/evidence/verification-4/`.
- Independent Axe runs found zero serious or critical findings on `/`, `/demo`, `/demo/report`, `/privacy`, and `/terms` in light desktop and dark 390 px contexts. The dark scans had no Axe findings at any impact level.
- Keyboard smoke: first Tab reached the skip link with a `3px solid rgb(21, 89, 214)` outline; Enter focused `main`. There was no observed trap.
- At 390 px, landing and demo document widths equaled the viewport, the first action was visible, and the smallest visible link/button target was 44 px.
- Reduced motion changed animation and transition duration to `0.00001s` and scroll behavior to `auto`.
- Browser request capture across landing, demo edit/reset/leave, audit, report, privacy, and terms saw only the product origin. No console or page errors occurred. CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` were present as response headers.
- The service worker updated to `activated`, controlled the page, and `/demo` reloaded offline with its saved sample and offline notice.
- HTML and the service worker use `Cache-Control: no-cache`; hashed JS, CSS, and the hero image use `public, max-age=31536000, immutable`.

## Build and performance

- `npm test`: pass — 3 unit tests and 30 browser runs.
- `npx tsc --noEmit`: pass.
- `cargo test`: pass — 7/7.
- `cargo fmt -- --check`: pass.
- `cargo clippy --all-targets -- -D warnings`: pass.
- `cargo build --release`: pass.
- Candidate-stamped `npm run build`: pass; `dist/` emitted. Initial JS is 32.16 KB raw / 10.12 KB gzip; CSS is 10.88 KB raw / 3.42 KB gzip; hero WebP is 148.04 KB. All are within budget.
- Live mobile Lighthouse on `/demo`: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.3 s, LCP 1.4 s, TBT 130 ms, CLS 0.
- `npm audit --omit=dev`: zero vulnerabilities.
- Docker, Podman, and Buildah are unavailable in this verifier container, so the Docker image itself could not be rebuilt. The Dockerfile was inspected, and its exact frontend and Rust release build stages were run directly.

## Defects by severity

### High — release blocking

1. **The deployed API does not enforce the documented request allowance.** More than twice the stated 40-request burst completed without a 429. The candidate binary enforces the limit locally, so this remains a deployment/system behavior failure. Confirm how client identity and shared limiter state behave behind ingress and across replicas, then repeat the live burst until request 41 returns 429 with `Retry-After: 1`.

2. **Demo mode accesses the real-audit namespace.** A fresh demo writes a blank `sra:audit:v1`; a demo with existing real data reads that key. Initialize the audit from the current route, never call `loadAudit(false)` on a demo entry, and strengthen `@claim:demo-sandbox` to instrument storage access from a fresh direct `/demo` context.

3. **The demo isolation claim test does not prove its declared sandbox.** Its manifest says a fresh browser enters demo, but the test first creates a real audit. Under the claims contract, this is not adequate evidence for the “separate sample data” and “nothing is saved” promise.

### Medium

4. **The researched freemium collaboration path is absent.** The live UI has no paid tier, buy/restore-license flow, or action to create a collaborative report. Dormant licensed report endpoints remain in the backend. The free smallest-useful workflow works, but the brief's paid collaborative reports and retention outcome are not delivered.

5. **The backend validation claim is tested below the public HTTP boundary.** `claim_backend_report_validation` calls `store_report` and `validate_report` directly. It does not demonstrate accepted/rejected request behavior through the authenticated route and its body-limit middleware. Either provide a recorded license-verification fixture and test the route or narrow the public claim.

6. **The service worker caches every successful same-origin GET.** This includes successful `/api/reports/<id>` responses if the dormant sharing feature is used. Such private report JSON could remain available from Cache Storage after server expiry. Exclude `/api/` from service-worker caching before exposing shared reports.

### Low

None.

## Re-run

```sh
npm ci
npm test
npx tsc --noEmit
VITE_BUILD_SHA=53f9247c104641aabef42d4a0c601d5f5ff53cb9 npm run build
cargo test
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
```
