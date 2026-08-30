# Independent verification 13 — FAIL

**Requested candidate:** `cfe3aa4eeaf2026284448a4212243e3e0183e8af`

**Available checkout and live build:** `cfe3aad49823790c3138f61912b6336f2ce7c7d9`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-verify-13`

## Decision

**FAIL — do not release the requested candidate.** The nominated candidate cannot be fetched from the repository, and the live service is the different base commit. Fresh production checks also show that the documented API rate limit is not enforced and that the paid shared-report backend is running on three ephemeral replicas without its required durable volume.

The available base source passes its local claims, tests, build, accessibility, privacy, offline, and performance checks. Those results do not override the candidate-identity and deployed-backend blockers.

## Release-blocking evidence

### 1. Requested candidate is unavailable and is not deployed — critical

- The clean clone started at `cfe3aad49823790c3138f61912b6336f2ce7c7d9`.
- `git fetch origin cfe3aa4eeaf2026284448a4212243e3e0183e8af` returned `fatal: remote error: upload-pack: not our ref`.
- A full fetch left `origin/main` at `cfe3aad49823790c3138f61912b6336f2ce7c7d9`; `git ls-remote origin` contains no requested-candidate object or ref.
- Live `/health` returns `{"status":"ok","build_sha":"cfe3aad49823790c3138f61912b6336f2ce7c7d9"}`.
- Azure runs image `sociobotregistry.azurecr.io/sf-screenreader-task-audit:cfe3aad49823`.
- Rebuilding the available base with that SHA produced `index-DUTMvzfP.js`. It is byte-identical to the live asset: 40,169 bytes and SHA-256 `c8ac740448ae02e2ec1aa4451845d6fce584d43ef58e8153112586c81f91286d`.

There is therefore no source or deployment evidence for `cfe3aa4eeaf2026284448a4212243e3e0183e8af`.

### 2. Production does not enforce the documented API allowance — high

The documented allowance is a burst of 40 requests per first `X-Forwarded-For` address, followed by `429` with `Retry-After: 1`.

- `npm run verify:live-rate-limit` failed: the 41-request burst returned 41 ordinary `404` responses and no `429`.
- An independent simultaneous 100-request burst from a second forwarded address returned **100×404, 0×429**.
- No `Retry-After` header was observed because no request was limited.

The live allowance observed is therefore **at least 100 concurrent requests per client**, not the documented 40. This directly fails the mandatory backend contract.

### 3. Paid shared reports have no durable or shared production store — critical

Fresh Azure control-plane evidence for the active healthy revision `sf-screenreader-task-audit--0000046` shows:

- `minReplicas: 1`, `maxReplicas: 3`;
- three running replicas (`RunningAtMaxScale`);
- `volumes: null`;
- `volumeMounts: null`;
- 100% traffic to this revision.

The server stores reports and limiter state in per-process SQLite and relies on exactly one replica plus `/app/data` durable storage. The live topology has neither. A paid private report can be routed to a replica that does not contain it and all report data can disappear on container replacement. `EXPECTED_BUILD_SHA=... npm run verify:live-deployment` fails with `expected exactly one replica, got min=1 max=3` for both the requested SHA and the actual base SHA.

## First-read and demo gate — PASS on the deployed base

A cold 1440×900 visit answers the required questions in the first screen:

- What it does: **“Record screen-reader task evidence.”**
- Who it is for: **“For blind founders and small teams fixing a critical dashboard task.”**
- What to click: **“Try it with sample data.”** Adjacent text says it opens five filled tasks and a prioritized report.

At 390×844, the headline, audience, action, result, and all three facts remain in the first viewport. One click opens five realistic Northstar Metrics tasks. The persistent banner says **“Demo — sample data, nothing is saved”** and provides **Reset demo** and **Start for real**. Editing and reset touched only `demo:sra:audit:v1`; leaving removed that key without creating `sra:audit:v1`.

## Mandatory claims — PASS on the available base (21/21)

`.factory/claims.json` exists. After the required clean `npm ci`, every exact manifest command passed independently:

- 18 Playwright claim commands passed in desktop Chromium and the 390 px project.
- `cargo test claim_backend_rate_limit` passed.
- `cargo test claim_backend_report_validation` passed.
- `cargo test claim_private_report_durability` passed.

Each claim has one matching browser test or one uniquely selected Rust test. Landing, legal, README, and copy-audit promises map to the manifest; no unlisted product claim was found. These local fixture/source results do not prove the failing live topology.

## Clean source gates — PASS on the available base

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 59 packages, 0 vulnerabilities |
| `npm test` | PASS; 8 Vitest + 58 Playwright |
| `cargo test` | PASS; 13 tests |
| `npx tsc --noEmit` | PASS |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets -- -D warnings` | PASS |
| `npm run build` | PASS; `dist/` produced |
| `cargo build --release` | PASS |
| `npm audit` and `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| Live Playwright, retries disabled | PASS; 56 passed, 2 fixture-only license tests skipped |

Docker is not installed in the verification worker, so the Docker image was not rebuilt locally. Static inspection confirms a multi-stage build, `rust:1-alpine`, `ARG BUILD_SHA=dev`, non-root runtime user, and `EXPOSE 8080`. The release binary was run from a temporary directory with `env -i PORT=18083`: `/health` returned `build_sha: dev`, documented SPA routes returned 200, an unknown route returned 404, and startup required no other configuration.

## Independent product workflow — PASS on the deployed base

A fresh browser context, not a repository test, exercised the smallest useful workflow:

- opened, edited, reset, and left the five-task demo without crossing storage namespaces;
- submitted empty setup and complete setup without consent, receiving the specific recovery message;
- operated consent with Space and accepted the exact 80-character audit-name boundary;
- recorded a blocked, critical task with all observation fields;
- attempted an event without the required observation, received native announced validation, then recovered and recorded it;
- reviewed the report and downloaded JSON with the correct schema, one task, and one trace event;
- updated the service worker, reloaded online, went offline, and reloaded the saved audit successfully.

The full suites additionally cover the five-task boundary, prioritized ordering, accessible HTML, anonymized JSON, confirmed import, invalid import recovery, license feedback/revocation fixtures, and a separate-context private report.

## Accessibility and responsive behavior — PASS on the deployed base

- Axe found 0 serious/critical issues on `/`, `/demo`, `/demo/report`, `/privacy`, `/terms`, and the real 404 in 390 px dark mode.
- The skip link is first in keyboard order; Enter focuses `<main>`; client navigation focuses the new `<h1>`.
- Focus uses a visible 3 px solid cobalt outline.
- The smallest visible link/button target measured 44 px.
- All public routes reflow at 200% text size without exceeding 390 px.
- Reduced motion changes the sheet animation duration to `0.00001s`; no looping or flashing content exists.
- The live URL verifier found one `<h1>`, `lang=en`, a main landmark, no missing image alternatives, no unlabeled buttons, and no console errors.
- Independent and full-suite runs found no console or page errors.

## Privacy, headers, caching, PWA, and performance — PASS on the deployed base

- The independent complete local-audit flow made ten requests to one origin only: `https://screenreader-task-audit.sociobot.in`.
- The private marker entered in task notes appeared in no URL or request body. No analytics, ads, capture APIs, third-party font/script requests, or task-content API request occurred.
- HTML responses carry a restrictive CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and camera/microphone/geolocation disabled.
- HTML, 404, and service worker responses use `Cache-Control: no-cache`; hashed assets use `public, max-age=31536000, immutable`.
- The service worker updated, controlled reload, exposed only cache `screenreader-task-audit-v6`, and supported both demo and saved-audit offline reloads.
- Production size: JS 40,169 bytes raw / 12.30 KB gzip; CSS 10.91 KB raw / 3.44 KB gzip; hero WebP 148,044 bytes; no font downloads.
- Fresh mobile Lighthouse on `/?demo=1`: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.121 s, FCP 1.121 s, TBT 121 ms, CLS 0.
- `/`, `/demo`, `/audit`, `/report`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, favicons, and social art return 200; an unknown path returns a designed real 404.
- Public catalog price is USD 39.00, and an unpaid checkout request returns 303 to a hosted Dodo session. No payment was submitted.

## Defects by severity

### Critical

1. The requested candidate SHA is absent from the repository and the live service runs a different commit.
2. The paid private-report service runs on three ephemeral, unshared SQLite stores with no durable volume, risking immediate inconsistency and data loss.

### High

1. Production does not return 429 after the documented 40-request allowance; even 100 simultaneous requests from one forwarded address were accepted by the API route.

### Medium

None.

### Low

1. The generated illustration provenance is recorded in `.factory/design.md`, but the public page does not disclose that generated imagery is used.

## Scope notes

This is a web-with-backend product, not a library or CLI, so consumer package installation does not apply. It has no sign-in flow, so the Sociobot Entra authority check does not apply. Valid purchase and refund behavior used recorded fixtures; live checkout verification stopped before payment.

## Evidence

- First-read and responsive screenshots: `.factory/verification-13-artifacts/verify-root/`
- Direct-demo screenshots and URL-verifier JSON: `.factory/verification-13-artifacts/verify-demo/`
- Independent mobile 404 screenshot: `.factory/verification-13-artifacts/independent-mobile-404.png`

