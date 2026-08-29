# Independent verification 12 — PASS

**Candidate:** `7e14629264bec2f84a18b93ec9924dfbb5437382`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-29

**Work order:** `screenreader-task-audit-verify-12`

## Decision

**PASS — releasable.** Fresh evidence confirms that the deployment-only blocker from verification 11 is repaired. The live application is the candidate build, has one healthy replica and the required durable mount, and passed the claims, product, accessibility, privacy, offline, performance, and backend gates below. No critical, high, or medium defects were found.

## First read and demo gate — PASS

A cold desktop and 390 px mobile visit answered all three required questions in the first viewport:

- What it does: **“Record screen-reader task evidence.”**
- Who it is for: **“For blind founders and small teams fixing a critical dashboard task.”**
- What to click first: **“Try it with sample data.”** The adjacent text says it opens five filled tasks and a prioritized report.

One click opened the realistic five-task Northstar Metrics sample. The persistent banner said **“Demo — sample data, nothing is saved”** and offered **Reset demo** and **Start for real**. Reset restored an edited task; leaving removed `demo:sra:audit:v1` without creating or changing `sra:audit:v1`.

Evidence: `verification-12-artifacts/first-read/live-desktop.png`, `verification-12-artifacts/first-read/live-mobile.png`, and `verification-12-artifacts/independent-live-flow.log`.

## Mandatory claims — PASS (19/19)

`.factory/claims.json` exists. After `npm ci`, every exact command in it passed from the candidate checkout. The 17 Playwright commands each passed in desktop Chromium and the 390 px project; both exact Rust commands passed.

| Claims | Result |
| --- | --- |
| `demo-sandbox`, `core-workflow`, `structured-capture`, `five-tasks` | PASS |
| `team-sharing`, `license-restore-feedback`, `report-priority`, `html-export` | PASS |
| `json-export`, `anonymous-export`, `import-json`, `privacy-boundaries` | PASS |
| `offline-reload`, `saved-audit-offline`, `free-audit-features`, `license-revocation` | PASS |
| `manual-evidence-not-certification` | PASS |
| `backend-rate-limit` (`cargo test claim_backend_rate_limit`) | PASS |
| `backend-report-validation` (`cargo test claim_backend_report_validation`) | PASS |

The landing page, legal pages, footer, README, and `.factory/copy-audit.md` were cross-checked against the manifest. No unlisted product claim was found. Per-claim logs are in `verification-12-artifacts/claims-installed/`.

## Clean checkout and production gates — PASS

```text
npm ci                                                    PASS; 0 vulnerabilities
all 19 commands from .factory/claims.json                 PASS
npm test                                                  PASS; 8 Vitest + 54 Playwright checks
cargo test                                                PASS; 12 tests
npx tsc --noEmit                                          PASS
cargo fmt --check                                         PASS
cargo clippy --all-targets --all-features -- -D warnings  PASS
VITE_BUILD_SHA=7e146292… npm run build                    PASS; dist/ produced
cargo build --release                                     PASS
npm audit --omit=dev                                      PASS; 0 production vulnerabilities
```

The release binary also started in a temporary working directory with only `PORT=18082`. `/health` returned `{"status":"ok","build_sha":"dev"}`; documented SPA routes returned 200 and an unknown route returned 404. The worker has no Docker, Podman, Buildah, or nerdctl client, so a second local container build was not possible. Static Dockerfile inspection passed, and the exact candidate-labelled image is running successfully in Azure.

## Independent product workflow — PASS

A separate 390 px, reduced-motion browser context exercised the smallest useful product rather than replaying a repository test:

- Opened and reset the five-task demo, then left it without copying demo data.
- Submitted an empty setup and a complete setup without consent; both showed the specific recovery message.
- Accepted the 80-character setup-field boundary and operated consent with Space.
- Recorded a blocked, critical task and recovered from a missing required trace observation.
- Reached the five-task boundary; the sixth-task action was disabled.
- Reviewed the report, confirmed the blocked critical task sorted first, exported JSON, and verified all five tasks.
- Reloaded the saved real report offline and retained all five report items.

The full local and live suites additionally covered every editable report field, all trace types, invalid JSON import and confirmed recovery, HTML export semantics, anonymization, license feedback/revocation fixtures, dark mode, 200% text reflow, route metadata, and the designed 404.

## Accessibility and browser quality — PASS

- Fresh AxeBuilder runs on `/`, `/demo`, `/demo/report`, `/privacy`, `/terms`, and the 404 found **0 serious or critical findings**, including mobile dark mode.
- Keyboard-only checks reached the skip link first, moved focus to `<main>`, moved route focus to the new `<h1>`, and moved task-switch focus to `#task-heading`.
- Visible focus was a 3 px designed outline; the measured smallest link/button target was 44 px.
- At 200% text size, the maximum document width on a 390 px viewport remained 390 px.
- Reduced motion computed the sheet animation as `0.00001s`; there is no looping or flashing motion.
- The local and live suites reported no console errors or page errors.
- `/opt/fleet/lib/verify-url.sh` passed `/` and `/demo`: correct title, `lang=en`, one `<h1>`, one main landmark, no missing image alternatives, and no unlabeled buttons.

Evidence: `verification-12-artifacts/accessibility-independent.log` and the two `verify-*/verify.json` files.

## Privacy, requests, and headers — PASS

The independent end-to-end request log contained ten requests and only one origin: `https://screenreader-task-audit.sociobot.in`. The unique URLs were the page shell, candidate JS, CSS, local collage, and report route. There were no analytics, ads, third-party fonts/scripts, capture calls, or task-content API requests. License verification is only initiated after a visitor explicitly submits a token; report content is sent only after a verified holder chooses **Create private link**.

Live HTML responses carried `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive camera/microphone/geolocation permissions policy, and a CSP with `frame-ancestors 'none'`. HTML, 404, and the service worker use `Cache-Control: no-cache`; hashed assets use `public, max-age=31536000, immutable`. `/missing` returned a real 404.

## Identity, performance, PWA, and backend — PASS

- `/health` returned the exact candidate SHA.
- Azure revision `sf-screenreader-task-audit--0000042` is healthy, has one replica and 100% traffic, uses image `sociobotregistry.azurecr.io/sf-screenreader-task-audit:7e14629264be`, and satisfies `minReplicas=1`, `maxReplicas=1` with the required `/app/data` durable mount.
- Candidate and live JavaScript were byte-identical: SHA-256 `421b8346f97d16c5e0f89ecd5af43eb489c770e6a78a5b687a3fb38e8bf2fd21`.
- Initial JavaScript is 40,163 bytes (12,232 gzip); CSS is 10,911 bytes (3,448 gzip); the hero WebP is 148,044 bytes. There are no font downloads. All are within budget.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.190 s, FCP 1.133 s, TBT 65 ms, CLS 0.
- Service-worker `update()` completed, the active worker controlled the reload, cache `screenreader-task-audit-v5` was current, and `/demo` plus a saved audit reloaded offline.
- The live API allowance is **40 requests per first `X-Forwarded-For` address**. A concurrent 41-request burst returned 40×404 and 1×429; a 100-request burst returned 40×404 and 60×429. Every 429 had `Retry-After: 1`, and a request after an idle second recovered to the ordinary 404 path.
- Backend concurrency, exact 200 KB/five-task validation boundaries, rollback-journal SQLite, durable restore/snapshot, single-connection persistence, and topology constraints passed the 12-test Rust suite.
- The public product catalog lists USD 39.00; an unpaid checkout request returned 303 to a hosted Dodo session. No payment was submitted.

## Defects by severity

- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **Low:** the generated hero’s full provenance is recorded in `.factory/design.md`, but the public footer does not disclose that the illustration is generated, as requested by the image-generation guidance. The footer also says “Visit Param Factory” instead of the standard “Built by Param Factory” attribution. These are non-blocking transparency/wording gaps; they do not affect product behavior, accessibility, privacy, or deployment safety.

## Scope notes

This is a web-with-backend product, not a library or CLI, so consumer package installation does not apply. It has no sign-in flow, so the Entra authority check does not apply. Valid and revoked license behavior uses recorded fixtures; the live catalog and hosted checkout handoff were verified without making a charge.
