# Independent verification 6 — FAIL

**Candidate:** `3fc865bc5205c82c1e8a6b0b4532f5b27010e513`  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Verified:** 2026-08-29 UTC  
**Decision:** **FAIL — do not release.**

The free local audit is useful and its declared browser claims pass, but two
mandatory acceptance boundaries fail on the candidate deployment: the live API
does not enforce its documented request allowance, and the dark-mode 404 page
has a serious WCAG color-contrast violation.

## Mandatory cold first read

**Pass.** On a fresh 1440 × 900 load, the first screen says:

- What it does: **“Record screen-reader task evidence.”**
- Who it is for: **“For blind founders and small teams fixing a critical
  dashboard task.”**
- What to click first: **“Try it with sample data,”** followed by “See five
  filled tasks and a prioritized report.”

The action is also visible at 390 × 844. One click opens the populated August
analytics audit with five realistic tasks and the persistent **“Demo — sample
data, nothing is saved”** banner, **Reset demo**, and **Start for real**. The
fresh demo used only `demo:sra:audit:v1`; no real-audit key was present.

## Mandatory claims gate

`npm ci` succeeded with 0 vulnerabilities. Every exact command in
`.factory/claims.json` was run independently from the clean candidate before
the broader QA. Browser commands each ran in desktop Chromium and the 390 px
mobile project.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS (2/2) |
| `core-workflow` | `npm run test:e2e -- --grep @claim:core-workflow` | PASS (2/2) |
| `structured-capture` | `npm run test:e2e -- --grep @claim:structured-capture` | PASS (2/2) |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | PASS (2/2) |
| `report-priority` | `npm run test:e2e -- --grep @claim:report-priority` | PASS (2/2) |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | PASS (2/2) |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | PASS (2/2) |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | PASS (2/2) |
| `import-json` | `npm run test:e2e -- --grep @claim:import-json` | PASS (2/2) |
| `privacy-boundaries` | `npm run test:e2e -- --grep @claim:privacy-boundaries` | PASS (2/2) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS (2/2) |
| `manual-evidence-not-certification` | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | PASS (2/2) |
| `backend-rate-limit` | `cargo test claim_backend_rate_limit` | PASS locally (1/1); contradicted live |
| `backend-report-validation` | `cargo test claim_backend_report_validation` | PASS (1/1) |

The local rate-limit claim passing does not satisfy the live backend contract.
The independently observed live behavior is documented below.

## Clean build and repository gates

- `npm test`: PASS — 4 Vitest tests and 32 Playwright runs.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS; `dist/` produced.
- Candidate-stamped `VITE_BUILD_SHA=3fc865bc… npm run build`: PASS.
- `cargo fmt -- --check`: PASS.
- `cargo clippy --all-targets -- -D warnings`: PASS.
- `cargo test`: PASS — 7/7.
- `cargo build --release`: PASS.
- `npm audit --omit=dev`: PASS — 0 vulnerabilities.
- `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run
  test:e2e`: PASS — 32/32 against live.

Docker is not installed in this verifier container, so the Docker image could
not be rebuilt. The exact frontend and optimized Rust stages passed directly.
The release binary was also started in a temporary directory with an empty
environment except `PATH`: it listened on default port 8080, created its data
directory, returned `{"status":"ok","build_sha":"dev"}`, and locally returned
429 with `Retry-After: 1` on request 41.

## Live identity and backend

- `GET /health` returned
  `{"status":"ok","build_sha":"3fc865bc5205c82c1e8a6b0b4532f5b27010e513"}`.
- The candidate-stamped JS and CSS matched live byte-for-byte:
  - JS SHA-256: `8d17b194660cb29b4bfeaa69ae1ba105c862bd6de02d6e464195e5c43276f14a`
  - CSS SHA-256: `8c2be49212f980a885eb3cca3900225e3830c16eba73d8577566593022b64a41`
- The candidate and live 404 assets also matched byte-for-byte.
- Live malformed JSON returned 400; a valid report without a license returned
  402; a 230 KB request returned 413; malformed and unknown report IDs returned
  404. The exact 200,000/200,001-byte and five/six-task boundaries pass the
  local backend claim test.
- **Live rate limit failed.** `npm run verify:live-rate-limit` expected request
  41 to return 429 but received 404. A separate 45-request sequential run also
  returned 45 × 404. A fresh 100-request concurrent burst returned 100 × 404
  and 0 × 429. No `Retry-After` was observable. The live allowance is therefore
  at least 100 requests, not the documented burst of 40.

## End-to-end workflow and recovery

Independent live testing, beyond the repository suite, confirmed:

- Empty setup announces “Fill every field and confirm the tester’s consent”
  and focuses `#audit-name`.
- Space toggles the native consent checkbox. A real audit persists after
  reload and remains absent from a separate browser context.
- An 80-character audit name persists exactly. A 1,001-character attempted
  observation is constrained to the documented 1,000-character field limit.
- A blank trace submission focuses its required observation field. Completing
  it recovers with “Trace event recorded.”
- A fifth task can be added and the sixth-task action is disabled.
- A critical blocked task appears first in the report and retains its blocker.
- Invalid import reports “This file is not a Screenreader Task Audit JSON
  report” and leaves the saved audit unchanged.
- The exported 3,087-byte HTML has `lang=en`, a title, one `h1`, one `main`, no
  scripts, and no axe violations. Anonymous JSON contains five tasks and
  replaces product, environment, screen reader, and browser with withheld
  values.

## Accessibility, keyboard, mobile, and motion

- Light-mode live axe scans on all application routes found no serious or
  critical issues. Dark-mode scans on `/`, `/demo`, `/demo/report`, `/audit`,
  `/privacy`, and `/terms` also found none.
- **Dark-mode `/missing` fails axe `color-contrast` at serious severity.** Six
  navigation/footer links use `#1559d6` on `#222832`, measured at **2.42:1**
  instead of 4.5:1. The same color is used for the focus outline, below the
  3:1 UI-indicator target. This is the real static 404 response, not the SPA
  fallback.
- Every checked route has one `h1`, one `main`, `lang=en`, route-specific
  metadata, and no horizontal overflow at 390 px under normal text sizing.
- Keyboard checks passed: first Tab reveals the skip link with a 3 px outline
  and 3 px offset; Enter focuses `main`; native radio arrows work; task tabs,
  trace controls, reset, and report navigation operate from the keyboard; SPA
  route changes focus the new `h1`.
- Reduced-motion emulation changed animation and transition duration to
  `0.00001s`; there are no looping animations.
- At 200% text size on a 1280 px viewport, the landing, demo, report, and audit
  pages had no horizontal overflow.
- Direct navigation to the intentional 404 records Chromium's expected failed
  document-resource console message. Public application routes had no console
  or page errors.

## Privacy, headers, PWA, links, and caching

- Request logs across landing, demo edits, setup, saved audit, report, privacy,
  and terms contained only the product origin and no `/api/` calls. No capture
  APIs, analytics, ads, third-party fonts, or third-party runtime scripts were
  observed.
- The shell returns CSP including `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a
  permissions policy disabling camera, microphone, and geolocation.
- The service worker reached `activated`, `registration.update()` succeeded,
  it controlled the next reload, and `/demo` reloaded offline with the sample
  task and offline notice. Cache name: `screenreader-task-audit-v5`. API paths
  are explicitly excluded from Cache Storage.
- Every discovered application link and the Param Factory external link
  resolved successfully; the designed missing route correctly returned 404.
  `robots.txt` and `sitemap.xml` are present.
- HTML and the service worker use `Cache-Control: no-cache`. JS and CSS use
  one-year immutable caching. The hero asset also receives immutable caching
  despite having a stable, non-content-hashed filename; see the Low finding.

## Performance

- Initial JS: 33,004 bytes raw / 10,299 bytes gzip.
- CSS: 10,878 bytes raw / 3,434 bytes gzip.
- Hero WebP: 148,044 bytes.
- Fresh Lighthouse 12.8.2 mobile run on `/?demo=1`: Performance **99**,
  Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1,151 ms,
  LCP 1,236 ms, TBT 119 ms, CLS 0.

## Defects by severity

### High — release blocking

1. **The live API does not enforce the documented 40-request allowance.**
   Request 41 and even a 100-request burst were not limited. This violates the
   mandatory backend contract and the public `backend-rate-limit` claim. The
   candidate binary works locally, so the failure is in deployed ingress,
   client identity, replica/storage behavior, or the running backend path.

2. **The dark-mode static 404 page has a serious axe contrast failure.** Its
   six blue links are 2.42:1 against the dark surface. Update `404.css` to use
   the dark palette's accessible link/focus color, then test the real 404 in
   both color schemes.

### Medium

3. **The researched freemium collaboration path is not user-accessible.** The
   repository has dormant licensed sharing endpoints, but the UI has no team
   share action, exact price, Sociobot checkout link, return-token handling, or
   restore-license path. The free smallest-useful audit works, but the brief's
   paid collaborative reports and retention offering are not delivered.

4. **The public validation claim is proven only below the HTTP/auth boundary.**
   `claim_backend_report_validation` calls validation/storage functions
   directly. It does not prove five/six-task and exact 200 KB behavior through
   the licensed public endpoint and request middleware. Use a recorded license
   verification fixture for an HTTP integration test or narrow the claim.

### Low

5. **The unversioned hero image is cached as immutable for one year.** Rename
   it with a content hash or give non-hashed assets a revalidating cache policy
   to avoid stale artwork after a future deployment.

## Re-run

```sh
npm ci
npm test
npx tsc --noEmit
VITE_BUILD_SHA=3fc865bc5205c82c1e8a6b0b4532f5b27010e513 npm run build
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
npm run verify:live-rate-limit
```
