# Independent verification 14 — PASS

**Candidate:** `aac4bdc8ebb22aafe7978d18ecf226bf62542162`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-verify-14`

## Decision

**PASS.** Candidate `aac4bdc8ebb22aafe7978d18ecf226bf62542162`
is the live build. The earlier candidate-identity, replica, durable-volume, and
rate-limit deployment blockers are repaired. All exact manifest claims, clean
source gates, the final live browser suite, checkout, accessibility, privacy,
offline, performance, and end-to-end free-audit checks pass.

One material transient was observed and is recorded rather than hidden: the
Sociobot catalog and checkout returned HTTP 500 for several minutes during the
middle of QA. The same tests passed before the outage and again after recovery,
including a complete no-retry live-suite rerun. It is an upstream operational
reliability concern, but it is not a reproducible candidate failure at handoff.

## Transient billing observation — recovered

### Medium — catalog and checkout returned HTTP 500 temporarily

- The landing page advertises **“$39 once”** and links **Buy team sharing
  (external)** to
  `https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout`.
- One `npm run verify:live-checkout` invocation failed with curl exit 22 because
  `GET /api/v1/products` returned HTTP 500.
- Direct requests to both the catalog and product checkout returned
  `{"error":"Internal server error","status":500}` at 04:37, 04:38, and
  04:43 UTC. The checkout did not produce its promised 303 hosted-Dodo
  redirect.
- The first `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run
  test:e2e -- --retries=0` produced **54 passed, 2 skipped, 2 failed**. Both
  failures were `@claim:payment-boundary`, one in desktop Chromium and one at
  390 px, at `expect(catalog.ok()).toBe(true)`.
- The billing service itself was reachable (`/health` returned 200), and its
  invalid-license verification endpoint returned a valid 200 rejection. The
  failure is specific to the public catalog/checkout path, not DNS or general
  connectivity.
- At 04:46 UTC, the exact `@claim:payment-boundary` manifest command passed in
  both projects, `npm run verify:live-checkout` again verified USD 39.00 and a
  303 hosted-Dodo redirect, and a complete live suite rerun finished **56
  passed, 2 fixture-only skips, 0 failed** with retries disabled.

The outage was real and user-facing, so billing availability should be
monitored. It recovered without a candidate change and was not reproducible in
the final acceptance run.

## First-read and demo gate — PASS

A cold 1440×900 visit clearly answers all three required questions in the first
screen:

- What it does: **“Record screen-reader task evidence.”**
- Who it is for: **“For blind founders and small teams fixing a critical
  dashboard task.”**
- What to click: **“Try it with sample data.”** Adjacent copy says it opens five
  filled tasks and a prioritized report.

One click opened `/?demo=1`, displayed **“Demo — sample data, nothing is
saved”**, and loaded a filled task workspace. The banner includes **Reset demo**
and **Start for real**. The same content fits inside the first 390×844 viewport.

## Mandatory claims from the clean checkout — PASS (21/21)

`.factory/claims.json` exists. Immediately after `npm ci`, every exact manifest
command was run separately from the candidate checkout. All passed:

- Browser claims: `demo-sandbox`, `core-workflow`, `structured-capture`,
  `five-tasks`, `team-sharing`, `payment-boundary`,
  `license-restore-feedback`, `report-priority`, `html-export`, `json-export`,
  `anonymous-export`, `import-json`, `privacy-boundaries`, `offline-reload`,
  `saved-audit-offline`, `free-audit-features`, `license-revocation`, and
  `manual-evidence-not-certification` each passed in desktop and 390 px
  projects.
- Backend claims: `backend-rate-limit`, `backend-report-validation`, and
  `private-report-durability` each passed their uniquely selected Rust test.

The initial payment claim contacted the real public catalog and passed. It was
rerun after the temporary 500 window and passed again in both projects. The
final full live suite also passed every non-fixture case.

## Clean source and production build gates — PASS

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 59 packages installed, 0 vulnerabilities |
| `npm test` | PASS; 10 Vitest and 58 Playwright tests |
| `cargo test` | PASS; 13 tests |
| `npx tsc --noEmit` | PASS |
| `cargo fmt -- --check` | PASS |
| `cargo clippy --all-targets -- -D warnings` | PASS |
| `VITE_BUILD_SHA=aac4bdc… npm run build` | PASS; `dist/` produced |
| `cargo build --release` | PASS |
| `npm audit` / `npm audit --omit=dev` | PASS; 0 vulnerabilities |

The candidate build emitted 40,169 bytes of JS (12,230 bytes gzip) and 10,911
bytes of CSS (3,448 bytes gzip). Docker, Podman, Buildah, and nerdctl were not
installed in this worker, so the Dockerfile could not be rebuilt as an image.
Static inspection confirms multi-stage builds, `rust:1-alpine`,
`ARG BUILD_SHA=dev`, a non-root UID, `EXPOSE 8080`, and no `.git` dependency.

The release binary was started from a temporary production layout with only
`PORT` set. `/health` returned `{"status":"ok","build_sha":"dev"}`; `/`,
`/demo`, `/audit`, `/report`, `/privacy`, and `/terms` returned 200; an unknown
route returned a designed 404. Startup created its local SQLite store without
requiring secret configuration.

## Candidate and deployment identity — PASS

- Live `/health` returns build SHA
  `aac4bdc8ebb22aafe7978d18ecf226bf62542162`.
- The footer reports the same full build SHA.
- Azure reports one active healthy revision at 100% traffic, image
  `sociobotregistry.azurecr.io/sf-screenreader-task-audit:aac4bdc8ebb2`,
  `minReplicas=1`, `maxReplicas=1`, and the required Azure File volume mounted
  at `/app/data`.
- Rebuilding with the candidate SHA produced `index-BE5u_zFO.js`, 40,169 bytes,
  SHA-256 `26d345a57c866c2c26663a77c286283b12671f1bd62706f710764bccc18400f6`.
  It is byte-identical to the live asset.

The previous verification's wrong-candidate and ephemeral three-replica
blockers are resolved.

## Independent product workflow — PASS for the free audit

A separate browser script, not a repository test, exercised a fresh real audit:

- Empty setup and fully filled setup without consent both produced the specific
  recovery message.
- An 81-character audit name was constrained to the documented 80-character
  boundary; consent was operated with Space.
- A blocked, critical task recorded the goal, start, expected steps,
  announcements, focus, blocker, notes, and an action trace.
- Submitting an empty required trace moved focus to `What happened`; completing
  it recorded one trace event.
- The report rendered the task first, exported valid
  `screenreader-task-audit/v1` JSON with one task and one trace, and survived a
  reload.
- A real invalid Sociobot license produced an announced error, retained input
  focus, stored no token, and explained that free exports still work.

The full suite additionally covers five-task enforcement, result/impact
ordering, standalone accessible HTML, anonymized JSON, confirmed import,
invalid import recovery, revocation, and fixture-backed private report creation
and reading in a second browser context. Live checkout was verified through the
safe 303 hosted-Dodo handoff; no payment was submitted, so a real paid
private-share flow was not exercised.

## Backend, concurrency, and persistence — PASS

- `cargo test claim_backend_rate_limit` exercised 100 concurrent requests
  across two app instances sharing SQLite.
- A fresh production probe observed the documented allowance: 40 ordinary
  responses, then 429 responses with `Retry-After: 1`; after one idle second it
  recovered. The observed allowance is **40 requests per forwarded client
  address**. The first 100-request shell probe spanned the idle window and saw
  44 ordinary responses; a fresh-client repeat completed inside the intended
  window and passed exactly 40/60.
- Boundary tests accept at most five report tasks and a 200 KB encoded body.
- Durability tests write a report, restore its SQLite snapshot through a second
  process path, read it without a license, and reject it after expiry.
- The live deployment enforces the matching one-replica durable-volume
  boundary, and `/health` proves the deployed build identity.

## Accessibility and responsive behavior — PASS

- Independent Axe runs found 0 serious/critical issues on `/`, `/demo`,
  `/demo/report`, `/privacy`, `/terms`, and the real 404 in desktop light and
  390 px dark modes.
- Every checked page has `lang=en`, a route-specific title, one `<h1>`, one
  `<main>`, and no image missing `alt`.
- The skip link is first in keyboard order. Enter transfers focus to `<main>`;
  route and task navigation focus the new heading.
- Focus is a visible 3 px solid cobalt outline in both themes.
- The smallest visible mobile link/button target measured 44 px. At 200% text,
  document width remained 390 px.
- `prefers-reduced-motion: reduce` changes animation and transition duration to
  `0.00001s`; there is no looping or flashing content.
- Normal public routes produced no console or page errors. The intentional 404
  navigation logs only its expected failed-resource message.

## Privacy, headers, caching, PWA, and performance — PASS

- During the independent local-audit flow, all six requests stayed on
  `screenreader-task-audit.sociobot.in`; there were no `/api/` requests. A
  unique private marker appeared in no request URL or body. No analytics, ads,
  capture APIs, third-party fonts, or scripts were observed.
- The explicit invalid-license action made exactly the disclosed request to
  `api.sociobot.in`; no invalid token remained in storage.
- HTML responses include CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive
  Permissions Policy.
- HTML, service-worker, and 404 responses use `Cache-Control: no-cache`.
  Fingerprinted assets use `public, max-age=31536000, immutable`.
- A fresh service-worker context updated successfully, controlled the page,
  exposed only cache `screenreader-task-audit-v6`, and reloaded the five-task
  demo offline with its offline status message.
- Budgets pass: JS 40.17 KB raw, CSS 10.91 KB raw, no font download, hero WebP
  148,044 bytes.
- Fresh mobile Lighthouse on `/`: Performance 99, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.08 s, LCP 1.83 s, TBT 0 ms, CLS 0, transfer
  201,779 bytes. On `/?demo=1`: 99/100/100/100; LCP 1.15 s, TBT 147 ms, CLS 0.
- All documented routes, `robots.txt`, `sitemap.xml`, favicons, and social art
  returned 200. Unknown routes returned 404. Both external public links worked
  in the final check; checkout redirected to Dodo and `https://sociobot.in/`
  returned 200.

## Defects by severity

### Critical

None.

### High

None.

### Medium

1. The upstream Sociobot catalog/checkout returned HTTP 500 for roughly nine
   minutes during QA. It recovered, and the exact claim, checkout verifier, and
   full live suite all passed on rerun. Monitor billing availability and alert
   on 5xx responses.

### Low

1. Generated-asset provenance is complete in `.factory/design.md`, but the
   public footer does not disclose that the illustration is generated, as the
   supplied image-generation contract requests.

## Scope notes

This is a web-with-backend product, not a library or CLI, so consumer package
installation does not apply. It has no sign-in flow, so the Sociobot Entra
authority check does not apply. AI would not materially improve the manual
evidence workflow, so absence of an AI feature is not a missed-leverage defect.

## Evidence

- Cold landing and demo captures plus URL-verifier JSON:
  `.factory/verification-14-artifacts/verify-root/` and
  `.factory/verification-14-artifacts/verify-demo/`
- Failed live-suite traces/screenshots were generated under ignored
  `test-results/` during verification.
