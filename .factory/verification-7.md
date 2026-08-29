# Independent verification 7 — FAIL

**Candidate:** `7fe080f991b7a1ce7fbd24f109f0dc47a1cdf12b`  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Verified:** 2026-08-29  
**Verdict:** **FAIL**

## Decision

The deployed candidate fails the mandatory public API rate-limit contract. A single forwarded client can exceed the documented 40-request burst without a `429` response or `Retry-After` header. This is release-blocking for a web-with-backend product.

`GET /health` returned `{"status":"ok","build_sha":"7fe080f991b7a1ce7fbd24f109f0dc47a1cdf12b"}`, so the live failure is against the candidate itself.

## First-read and demo result

Cold live-page read: “Record screen-reader task evidence” is for “blind founders and small teams fixing a critical dashboard task.” The visible primary link is “Try it with sample data,” and says it will show “five filled tasks and a prioritized report.” This answers what it does, for whom, and what to do first in plain words. Clicking it entered the isolated demo in one step with a persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start for real controls. This gate passed.

## Required claim tests — all passed locally

The clean checkout had `.factory/claims.json`. After `npm ci`, every exact listed command passed from the product demo entry point:

| Claim ID | Command | Result |
| --- | --- | --- |
| demo-sandbox | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS (2 projects) |
| core-workflow | `npm run test:e2e -- --grep @claim:core-workflow` | PASS |
| structured-capture | `npm run test:e2e -- --grep @claim:structured-capture` | PASS |
| five-tasks | `npm run test:e2e -- --grep @claim:five-tasks` | PASS |
| report-priority | `npm run test:e2e -- --grep @claim:report-priority` | PASS |
| html-export | `npm run test:e2e -- --grep @claim:html-export` | PASS |
| json-export | `npm run test:e2e -- --grep @claim:json-export` | PASS |
| anonymous-export | `npm run test:e2e -- --grep @claim:anonymous-export` | PASS |
| import-json | `npm run test:e2e -- --grep @claim:import-json` | PASS |
| privacy-boundaries | `npm run test:e2e -- --grep @claim:privacy-boundaries` | PASS |
| offline-reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| manual-evidence-not-certification | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | PASS |
| backend-rate-limit | `cargo test claim_backend_rate_limit` | PASS (100 concurrent, shared SQLite test) |
| backend-report-validation | `cargo test claim_backend_report_validation` | PASS |

## Local build and test evidence

```text
npm ci                                               PASS (0 vulnerabilities)
npm test                                             PASS (4 unit, 34 browser)
npx tsc --noEmit                                     PASS
npm run build                                        PASS; dist/ produced
cargo test                                           PASS (7/7)
cargo fmt --check                                    PASS
cargo clippy -- -D warnings                          PASS
cargo build --release                                PASS
```

The production binary was run directly. With `BUILD_SHA` set to the candidate and `PORT=18080`, `/health` succeeded with that SHA and a hashed JS asset returned `Cache-Control: public, max-age=31536000, immutable`. With an otherwise empty environment (only `PATH` and `PORT`), it started, created local storage, and `/health` returned build SHA `dev`. The Docker build could not be attempted because `docker` is absent in this QA container; this is an environment limitation, not evidence that the Dockerfile failed.

## Live functional, accessibility, privacy, and performance evidence

- Full live suite: `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e` — **PASS, 34 tests**.
- Representative end-to-end flows passed through the claims: required consent and validation recovery; every structured trace type; five-task boundary; blocked/partial/completed prioritization; HTML, JSON, and anonymized exports; import confirmation and invalid-file recovery; local persistence; demo reset and discard on Start for real.
- A cold landing request log contained only the document, local JS/CSS, and local hero image. Demo flow request logs on desktop and 390 px mobile contained only same-origin document/JS/CSS; no analytics, ads, capture API, task-content server request, or third-party font/script was observed. The privacy claim test also passed across all public app routes.
- Landing response headers included CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and camera/microphone/geolocation disabled. HTML and service worker revalidate; hashed JS and WebP assets are immutable for one year.
- `/opt/fleet/lib/verify-url.sh` passed live landing and `/demo`: title, `lang=en`, exactly one h1, main landmark, image alternatives, no unlabeled buttons, and no console errors. Screenshots and JSON are in `.factory/evidence/verification-7-landing/` and `.factory/evidence/verification-7-demo/`.
- Independent axe scans found zero serious/critical violations on live demo at desktop and 390 px. No console/page errors, no horizontal overflow, and reduced-motion sheet animation reduced to `0.00001s`. Keyboard suite passed skip-link operation and focus transfer to the destination h1.
- Service worker was controlled and `activated`; `registration.update()` succeeded; after first online visit, offline reload displayed the offline notice and sample audit on desktop and mobile.
- Mobile Lighthouse on live `?demo=1`: Performance **92**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.4 s, LCP 1.6 s, TBT 330 ms, CLS 0. Initial JS is 33,004 B / 10.3 KB gzip; CSS 10.9 KB / 3.4 KB gzip; hero WebP 148,044 B.

## Release-blocking defect

### High — deployed backend rate limiter is ineffective

The documented and claimed policy is 40 API requests per first `X-Forwarded-For` address, then `429` with `Retry-After: 1`. Local unit and claim tests pass, but the public deployment did not:

```text
$ npm run verify:live-rate-limit
41-request burst: expected 40 ordinary 404 responses, got 41
```

I repeated the test immediately against the candidate health identity using a new forwarded address (`198.51.100.251`) and 100 concurrent harmless GETs to a missing report:

```text
404=100
429=0
```

No request was rejected, therefore no `Retry-After` header was present. The only observed allowance is **at least 100 concurrent requests**; the required 40 cannot be confirmed. The likely deployment boundary is separate per-replica/local SQLite limiter state or routing that bypasses the limiter, but this report records behaviour rather than assuming the cause.

## Non-blocking product gap

### Medium — stated paid collaboration offer is not end to end

The researched brief calls for a freemium product where paid collaborative reports and retention support teams. The shipped UI exposes only the free local audit. It has no team-share action, price, Sociobot checkout, license return storage/verification, restore-license field, or public route to create a shared report. Backend route stubs do not make the paid collaboration workflow usable. Complete that flow before representing the product as freemium with collaborative paid reports.

## Re-test instructions

1. Deploy a limiter topology with one shared client counter across every live instance (or intentionally run exactly one verified instance).
2. Run `npm run verify:live-rate-limit`; it must print the 41=40/1 and 100=40/60 results and idle recovery.
3. Re-run the full live Playwright suite and verify `/health` still reports the source commit being accepted.
