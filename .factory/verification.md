# Independent verification — FAIL

**Candidate:** `175ef58655edffdb2f6cdc92544531e2e89925b0`
**Live URL:** https://screenreader-task-audit.sociobot.in
**Verified:** 2026-08-28 (UTC)

## Verdict

**FAIL — do not release.** The production server returns HTTP 404 for every SPA deep link, including the required demo entry point. The returned HTML happens to boot the SPA, but the bad document status produces browser console errors, breaks direct links/crawling, and violates the required real-route/200 and no-console-errors gates.

Fresh evidence:

| Request | Live status | Local release-binary status |
| --- | ---: | ---: |
| `/` | 200 | 200 |
| `/demo` | 404 | 404 |
| `/audit` | 404 | 404 |
| `/privacy` | 404 | 404 |
| `/terms` | 404 | 404 |
| `/demo/report` | 404 | 404 |

Chromium emitted `Failed to load resource: the server responded with a status of 404` for each of those document URLs. `/health` on the live deployment returned `{"status":"ok","build_sha":"175ef58655edffdb2f6cdc92544531e2e89925b0"}`, so this is the candidate deployment, not a stale environment.

## First-read and demo gate

**Pass in the landing-page client flow.** Cold live text says: “Prove which screen-reader tasks work,” names “blind founders and small teams,” and presents **Try it with sample data** with “See five filled tasks and a prioritized report.” The one-click action is present. The direct `/demo` URL is nevertheless a release blocker because its HTTP response is 404.

## Claim-test gate (run first from a clean install)

All listed commands passed using the demo entry point where applicable:

| Claim | Command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | Pass: 2/2 (desktop, mobile) |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | Pass: 2/2 |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock` | Pass: 2/2 |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | Pass: 2/2 |
| `local-privacy` | `npm run test:e2e -- --grep @claim:local-privacy` | Pass: 2/2 |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass: 2/2 |
| `shared-expiry` | `cargo test claim_shared_links_expire_after_30_days` | Pass: 1/1 |

## Other verification

- `npm ci`: completed. `npm audit --omit=dev`: 0 production vulnerabilities.
- `npm test`: passed: 3 Vitest tests and 16 Playwright runs.
- `cargo test`: passed: 4 tests.
- `npx tsc --noEmit`, `cargo fmt -- --check`, and `cargo clippy --all-targets -- -D warnings`: passed.
- `cargo build --release` and `npm run build`: passed. Vite emitted `dist/`; JS 31.43 KB / 10.09 KB gzip, CSS 10.66 KB / 3.38 KB gzip, hero WebP 148,044 bytes.
- Docker daemon was unavailable in this verifier environment, so the exact image could not be built. The production Rust binary was built and run directly.
- Live desktop and 390 px checks: no horizontal overflow on `/`, `/demo`, or `/demo/report`; one `h1` and one `main` on all checked routes.
- Live axe scans: no serious or critical findings on `/`, `/demo`, `/demo/report`, `/privacy`, or `/terms`.
- Keyboard: the first Tab focuses “Skip to main content” with a visible `rgb(21, 89, 214) solid 3px` outline. Route-focus behavior passed in the repository suite.
- Reduced motion: `.sheet` animation duration becomes `0.00001s`; document scroll behavior is `auto`.
- Invalid setup showed “Fill every field and confirm the tester’s consent.” Completing fields and consent recovered. A blank trace event produced native required-field feedback; filling it produced “Trace event recorded.” The five-task cap disabled **Add task** at 5. Anonymous JSON export completed.
- Demo network capture during edit and report review made only same-origin requests. The demo claim test also passed offline reload after service-worker activation.
- Privacy/security headers are present live: CSP restricts scripts/styles/images to self and connections to self plus `api.sociobot.in`; `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are present. No CDN fonts or runtime scripts were found.
- Backend: live `/health` reports the candidate SHA; unauthenticated `POST /api/reports` returns 402 JSON and an invalid license returns 402 JSON. A simultaneous 120-request live burst to `GET /api/reports/<valid-format-missing-id>` returned 40 × 404 and 80 × 429; limited responses included `Retry-After: 1`. The local release binary gave the same threshold (40 normal, 30 limited in a 70-request burst).

## Defects

### High — release blocking

1. **SPA routes are HTTP 404 in production and in the release binary.** `ServeDir::not_found_service(ServeFile::new(dist/index.html))` supplies the SPA body while retaining the 404 status. This affects the explicit demo URL and every app/legal route. Return `index.html` with status 200 for known SPA routes, retain a real 404 only for unknown routes, then add production-server tests for direct load and reload of `/demo`, `/audit`, `/privacy`, `/terms`, `/report`, and `/share/<id>`.

2. **Claims contract is incomplete and the sharing claim test does not prove its claim.** The page/README promise JSON export, anonymized export, `$39 once`, Sociobot/Dodo payment/refunds, no-account report opening, and local/shared storage behavior, but `.factory/claims.json` does not list individual observable tests for several of these. In particular `@claim:license-unlock` only intercepts license verification and asserts that the **Create private link** button is visible; it does not create a link or open it in a clean context. The claims skill requires every relied-on claim to be listed and each test to prove the promised observable outcome. Add/strengthen tests or remove the unsupported claims.

### Medium

3. **No cache policy is sent for immutable hashed assets.** Live JS, CSS, WebP, and service-worker responses have `Last-Modified` but no `Cache-Control` or `ETag`. This misses the stated long-lived immutable caching requirement and causes avoidable reload traffic. Set a long immutable cache policy for fingerprinted `/assets/*`; keep HTML and the service worker short-lived/revalidating.

## Repair acceptance

The repaired candidate must return 200 for direct navigation/reload of all documented SPA routes, have no console errors on those routes, rerun every claim command from `.factory/claims.json`, and add complete observable claim coverage before a new independent verification.
