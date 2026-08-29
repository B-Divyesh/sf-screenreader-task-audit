# Independent verification 9 — FAIL

**Candidate:** `6fd6ece481e96a5d88f280909781ac74a2914535`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-29

**Verdict:** **FAIL**

## Decision

The candidate is not releasable. The exact candidate is live and the free,
local-first audit works well, but two shipped backend/product promises fail:

1. The public API does not enforce its documented 40-request allowance. The
   deployment permits three replicas even though the limiter and report store
   are replica-local SQLite. All five fresh-client verification runs failed.
2. The advertised **Buy team sharing** action returns HTTP 404, so a new user
   cannot buy the $39 collaboration feature.

The paid-license restore form also gives no visible or announced result after
an invalid license check. These are fresh live findings, not a repetition of a
previous deployment-only report.

## First-read and one-click demo gate

**PASS.** A cold 1440 px live visit showed, within the first screen:

- What it does: “Record screen-reader task evidence.”
- Who it is for: “For blind founders and small teams fixing a critical
  dashboard task.”
- What to do first: **Try it with sample data**, beside “See five filled tasks
  and a prioritized report.”

The same information and action were visible at 390 px. One click opened a
realistic five-task workspace at `/?demo=1`. The persistent banner said “Demo
— sample data, nothing is saved” and included **Reset demo** and **Start for
real**.

## Mandatory claim commands

`.factory/claims.json` exists and contains 15 claims. After `npm ci` from the
clean candidate checkout, every exact manifest command passed against the
product's local production-style demo entry point.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS, desktop + mobile |
| `core-workflow` | `npm run test:e2e -- --grep @claim:core-workflow` | PASS, desktop + mobile |
| `structured-capture` | `npm run test:e2e -- --grep @claim:structured-capture` | PASS, desktop + mobile |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | PASS, desktop + mobile |
| `team-sharing` | `npm run test:e2e -- --grep @claim:team-sharing` | PASS with recorded license/report fixtures |
| `report-priority` | `npm run test:e2e -- --grep @claim:report-priority` | PASS, desktop + mobile |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | PASS, desktop + mobile |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | PASS, desktop + mobile |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | PASS, desktop + mobile |
| `import-json` | `npm run test:e2e -- --grep @claim:import-json` | PASS, desktop + mobile |
| `privacy-boundaries` | `npm run test:e2e -- --grep @claim:privacy-boundaries` | PASS, desktop + mobile |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, desktop + mobile |
| `manual-evidence-not-certification` | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | PASS, desktop + mobile |
| `backend-rate-limit` | `cargo test claim_backend_rate_limit` | PASS |
| `backend-report-validation` | `cargo test claim_backend_report_validation` | PASS |

The `team-sharing` sandbox proves token handling and report creation only with
mocked fixtures. It checks that the checkout link has the expected URL but
does not open it. Consequently it passes while the live purchase endpoint is
404. The landing/README claim that Sociobot and Dodo handle a usable checkout
is not proven by a sandbox outcome.

## Release-blocking findings

### High — the public API exceeds its mandatory 40-request allowance

The repository documents a burst allowance of 40 requests per first
`X-Forwarded-For` address, followed by `429` and `Retry-After: 1`. The checked-in
`.factory/container-scale.json` requires `minReplicas=1`, `maxReplicas=1`
because both report persistence and rate-limit state use local SQLite.

Fresh Azure evidence instead showed:

```json
{
  "revision": "sf-screenreader-task-audit--0000032",
  "image": "sociobotregistry.azurecr.io/sf-screenreader-task-audit:6fd6ece481e9",
  "min": 1,
  "max": 3
}
```

`EXPECTED_BUILD_SHA=6fd6ece... npm run verify:live-deployment` failed with
`expected exactly one replica, got min=1 max=3`.

Five sequential `npm run verify:live-rate-limit` runs used five unused client
addresses. **All five failed:**

| Client | First failed boundary |
| --- | --- |
| `198.51.100.221` | 100-request burst allowed 48 ordinary requests |
| `198.51.100.222` | 100-request burst allowed 42 ordinary requests |
| `198.51.100.223` | 100-request burst allowed 73 ordinary requests |
| `198.51.100.224` | request 41 was allowed; 41/41 were ordinary |
| `198.51.100.225` | request 41 was allowed; 41/41 were ordinary |

An independent 100-request burst from `198.51.100.226` returned **80×404 and
20×429**. Every 429 did include `Retry-After: 1`, but the observed allowance
was 80, not 40. Thus a single client demonstrably went past the promised limit.

The local release binary behaved correctly: 100 concurrent requests produced
40×404 and 60×429, every 429 had `Retry-After: 1`, and a request after 1.1
seconds recovered to 404. This local/live difference is consistent with the
live three-replica topology. The same topology can route a newly created
SQLite-backed shared report to a replica that does not contain it.

### High — the advertised paid checkout is unavailable

The landing page and README advertise **$39 once** team sharing and link to:

```text
https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout
```

A fresh GET returned:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The license verification endpoint itself responds and has correct CORS; an
invalid token returned `200 {"valid":false,"reason":"invalid"}`. The product
backend also returned 402 for missing and invalid licenses. However, without a
working checkout there is no supported path for a new user to obtain a valid
license, so the paid collaborative report job cannot be completed end to end.
No shared-report persistence test with a real license was possible for the
same reason.

### Medium — restore-license failures are silent

On the live landing page, I entered `qa-invalid-token` in **Paste your
team-sharing license** and chose **Verify license**. The Sociobot response was
HTTP 200 with `valid:false`. The application then:

- stored the invalid token in `sb_license:screenreader-task-audit`;
- cleared the visible input;
- moved focus to `<body>`; and
- showed no “not active” or “could not be verified” message.

`verifyLicense()` sets a useful message, but `landing()` renders no status/live
region containing it. This leaves the user without the required action
feedback or recovery instruction. The fixture claim test starts on `/report`
with a valid token and therefore misses the advertised landing restore flow.

## Local build and quality gates

```text
npm ci                                                   PASS; 0 vulnerabilities
npm test                                                 PASS; 5 unit + 44 browser tests
cargo test                                               PASS; 8 tests
npx tsc --noEmit                                         PASS
cargo fmt --check                                        PASS
cargo clippy --all-targets --all-features -- -D warnings PASS
npm run build                                            PASS; dist/ produced
cargo build --release                                    PASS
npm audit --omit=dev                                     PASS; 0 vulnerabilities
```

The release binary started with an otherwise empty environment containing
only `PATH` and `PORT=18081`. It logged the default `data` directory and
`build_sha=dev`, served `/health`, handled 100/100 concurrent health requests,
returned 402 for unauthenticated report creation, and returned 413 for a body
over the transport limit.

Docker and Podman are unavailable in this verifier image. Static Dockerfile
inspection passed: separate Node/Rust stages, `rust:1-alpine`, no `.git`
dependency, `ARG BUILD_SHA=dev`, non-root final user, port 8080, and only
optional runtime configuration.

## Independent functional evidence

- A fresh demo context contained only `demo:sra:audit:v1`; no real audit key
  was present.
- Editing a task survived reload. **Reset demo** restored “Change the report
  date range.”
- Keyboard activation of a second task moved focus to `#task-heading` and
  announced “Editing task Find the top-selling product.”
- Keyboard activation of **Add trace event** moved focus to its first field;
  recording the event returned focus to the toggle and announced success.
- The report order was blocked/critical, partial/high, partial/medium,
  completed, completed.
- JSON exported schema `screenreader-task-audit/v1`, five tasks, and the newly
  recorded trace. Accessible HTML contained `lang=en`, `<main>`, starting
  place, other notes, and trace evidence.
- Submitting an empty real-audit setup produced the consent/field error, then
  valid inputs recovered and created the audit.
- Invalid import produced “This file is not a Screenreader Task Audit JSON
  report.”
- Live report API boundaries returned 402 without a license, 402 for an
  invalid license, and 413 over the body transport limit.
- The full live repository suite passed: `PLAYWRIGHT_BASE_URL=... npm run
  test:e2e` — 44/44.

## Privacy, security headers, and caching

During an independent demo edit, reload, reset, trace, report, and two-export
flow, Playwright recorded six requests. They were all same-origin GETs. There
were no `/api` requests, external requests, console errors, or page errors.

The live document sends CSP with `frame-ancestors 'none'`, `nosniff`,
strict-origin referrer policy, and a permissions policy disabling camera,
microphone, and geolocation. HTML and the service worker return `no-cache`.
Hashed JS/CSS and the hero WebP return one-year immutable caching. A missing
route returns the designed 404.

`/opt/fleet/lib/verify-url.sh` passed `/` and `/demo`: HTTP 200, titles,
`lang=en`, one h1, main landmark, no missing image alternatives, no unlabeled
buttons, and no console/page errors.

## Accessibility, mobile, and PWA

- Independent axe scans found zero violations of any impact in light and dark
  modes at 1440 px and 390 px.
- Keyboard traversal showed a 3 px visible cobalt focus outline in light and
  dark modes, including task buttons and form controls. The skip link works.
- All visible links/buttons measured at least 44 px. The demo had no
  horizontal overflow at 390 px, including with root text enlarged to 200%.
- Reduced motion changed the 180 ms sheet animation to 0.01 ms.
- Desktop and mobile visual inspection found no clipping, overlap, hidden
  actions, or generic framework styling. The risograph evidence-desk identity
  matches `.factory/design.md` and the original asset provenance is recorded.
- `registration.update()` completed with the worker activated and controlling
  the page. A subsequent offline reload at 390 px showed both the offline
  notice and the sample audit.

## Performance and deployment identity

Fresh mobile Lighthouse on `/demo`:

```text
Performance 98 · Accessibility 100 · Best Practices 100 · SEO 100
FCP 1.1 s · LCP 1.2 s · TBT 150 ms · CLS 0 · transfer 52 KiB
```

Candidate production assets are within budget: JS 39,783 bytes (about 12.1 KB
gzip), CSS 10,911 bytes (about 3.45 KB gzip), and hero WebP 148,044 bytes.

The exact candidate is deployed despite the topology failure:

- `/health` reports `6fd6ece481e96a5d88f280909781ac74a2914535`.
- The footer reports the same full SHA.
- Azure image tag is `6fd6ece481e9`.
- A build with `VITE_BUILD_SHA` set to the candidate produced byte-for-byte
  matches for live HTML, JS, CSS, service worker, and hero asset.

## Scope notes

This is a web-with-backend/PWA, not a library or CLI, so consumer package
installation does not apply. It has no sign-in flow, so the Microsoft Entra
authority check does not apply. AI would not improve the brief's manual,
privacy-preserving evidence job; import, export, offline demo, and sharing are
already the relevant leverage points. No product code was modified.

## Required retest

1. Apply `.factory/container-scale.json` so the live app is exactly one
   replica, then repeat multiple fresh 41/100-request probes and confirm the
   exact 40-request boundary with `Retry-After: 1`.
2. Enable/register the live Sociobot product and complete a real test purchase,
   return-token flow, private-link creation, cross-request report read, and
   refund/revocation check.
3. Render and announce license verification progress, success, and failure on
   the landing restore form; keep useful focus and add claim coverage for this
   path and the live checkout outcome.

