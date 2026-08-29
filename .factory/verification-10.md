# Independent verification 10 — FAIL

**Candidate:** `13221a5fbf4b8d29b93e22acc5735fc8552178c4`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-29

**Work order:** `screenreader-task-audit-verify-10`

## Decision

The candidate is **not releasable** under the supplied acceptance contract.
The exact candidate is live, the core audit works end to end, every listed
claim test passes after a clean install, and the earlier deployment failures
are repaired. However, the public site still contains material claim-like
sentences that have no entry and exact tagged sandbox test in
`.factory/claims.json`. The attached claims contract explicitly makes an
unlisted claim a failing review.

No product code was modified during verification.

## First-read and one-click demo gate

**PASS.** A cold 1440 px visit answered all three required questions in the
first screen:

- What it does: “Record screen-reader task evidence.”
- Who it is for: “For blind founders and small teams fixing a critical
  dashboard task.”
- What to do first: **Try it with sample data**, beside “See five filled tasks
  and a prioritized report.”

The action opened `/demo` in one click. The realistic five-task workspace was
already populated and showed the persistent “Demo — sample data, nothing is
saved” banner with **Reset demo** and **Start for real**. The same gate was
clear at 390 px.

Evidence: `verification-10-artifacts/first-read-desktop.png`,
`verification-10-artifacts/demo-mobile-390.png`.

## Mandatory claim tests

`.factory/claims.json` exists and contains 16 claims. The required commands
were first invoked before dependency installation as directed; the 14 browser
commands could not collect because a clean clone intentionally has no
`node_modules`, while both Rust commands passed. After the required clean
`npm ci`, every exact manifest command passed. The executable candidate result
is therefore **16/16 PASS**.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS, desktop + 390 px |
| `core-workflow` | `npm run test:e2e -- --grep @claim:core-workflow` | PASS, desktop + 390 px |
| `structured-capture` | `npm run test:e2e -- --grep @claim:structured-capture` | PASS, desktop + 390 px |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | PASS, desktop + 390 px |
| `team-sharing` | `npm run test:e2e -- --grep @claim:team-sharing` | PASS, desktop + 390 px |
| `license-restore-feedback` | `npm run test:e2e -- --grep @claim:license-restore-feedback` | PASS, desktop + 390 px |
| `report-priority` | `npm run test:e2e -- --grep @claim:report-priority` | PASS, desktop + 390 px |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | PASS, desktop + 390 px |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | PASS, desktop + 390 px |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | PASS, desktop + 390 px |
| `import-json` | `npm run test:e2e -- --grep @claim:import-json` | PASS, desktop + 390 px |
| `privacy-boundaries` | `npm run test:e2e -- --grep @claim:privacy-boundaries` | PASS, desktop + 390 px |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, desktop + 390 px |
| `manual-evidence-not-certification` | `npm run test:e2e -- --grep @claim:manual-evidence-not-certification` | PASS, desktop + 390 px |
| `backend-rate-limit` | `cargo test claim_backend_rate_limit` | PASS |
| `backend-report-validation` | `cargo test claim_backend_report_validation` | PASS |

## Release-blocking finding

### High — the claims manifest and copy audit omit shipped claims

The following public sentences are not represented by an exact claim entry
and tagged sandbox test:

1. Every public page footer says **“Record task evidence and fix blockers.”**
   The product records and prioritizes observations; it does not itself fix a
   blocker. No claim entry tests that outcome, and the sentence is omitted
   from `.factory/copy-audit.md` despite the requirement to inventory every
   landing-page sentence.
2. The offline status says **“You are offline. Saved audits and the demo still
   work.”** The `offline-reload` manifest entry and tagged test cover only the
   demo. A fresh independent real-audit check showed that a saved audit does
   currently reload offline, but this broader promise is still absent from the
   manifest and its sandbox never creates a real audit.
3. The paid section says **“Accessibility features stay free.”** This is a
   material paywall promise, but no claim entry defines the covered features
   or proves that the unlicensed state keeps them available.
4. `/terms` says **“A refund revokes the license.”** The `team-sharing` claim
   proves the catalog price, hosted checkout redirect, a fixture-valid
   license, and fixture report creation. It does not exercise a revoked verdict
   or a refund/revocation transition.

The claims skill states that any unlisted claim fails review until the copy is
removed or an exact manifest entry and observable test are added. Truth seen
in an ad hoc check does not replace the required build-time claim contract.

Required repair: remove or narrow unsupported sentences, or add one exact
`.factory/claims.json` entry and one `@claim:<id>` test for every retained
promise. Update `.factory/copy-audit.md` so it includes the footer, offline
status, and legal/paid copy it is meant to audit.

## Functional and recovery evidence

- A fresh demo context created only `demo:sra:audit:v1`; it did not read or
  write `sra:audit:v1`.
- Keyboard activation of the second task moved focus to its task heading.
- Editing sample data and choosing **Reset demo** restored “Change the report
  date range.” **Start for real** removed the demo key.
- JSON export produced schema `screenreader-task-audit/v1` with five tasks.
- An empty real-audit submission rendered
  “Fill every field and confirm the tester’s consent.” in `role=alert`.
  Supplying the four fields and keyboard-checking consent recovered and
  created the audit.
- The full local and live Playwright suites cover normal creation, every task
  observation field, focus/action/announcement traces, report priority, HTML
  and JSON exports, anonymization, exact import restoration, invalid JSON,
  five-task boundary, license feedback, shared report states, and 404s.
- A real invalid Sociobot license request returned HTTP 200 with
  `valid:false`; the page announced the inactive result, retained input focus,
  and stored no token.

## Clean build and repository gates

```text
npm ci                                                    PASS; 0 vulnerabilities
npm test                                                  PASS; 5 unit + 46 browser tests
PLAYWRIGHT_BASE_URL=https://... npm run test:e2e          PASS; 46 live browser tests
cargo test                                                PASS; 8 tests
npx tsc --noEmit                                          PASS
cargo fmt --check                                         PASS
cargo clippy --all-targets --all-features -- -D warnings  PASS
npm run build                                             PASS; dist/ produced
cargo build --release                                     PASS
npm audit --omit=dev                                      PASS; 0 vulnerabilities
```

The production build contains 40,193 bytes of JavaScript (about 12.3 KB
gzip), 10,911 bytes of CSS (about 3.4 KB gzip), and a 148,044-byte hero WebP.
All are below the supplied budgets.

Docker and Podman are unavailable in this verifier container. Static
Dockerfile inspection passed: separate Node and Rust stages, `rust:1-alpine`,
no `.git` dependency, defaulted `BUILD_SHA`, non-root Alpine runtime, and port
8080.

## Deployment identity, backend, and paid boundary

The deployment-only failures reported earlier are repaired from fresh
evidence:

- `/health` returns the exact full candidate SHA.
- The live footer returns the same candidate SHA.
- `npm run verify:live-deployment` confirmed `minReplicas=1` and
  `maxReplicas=1`.
- A candidate-labeled local production build and the live `index.html`, JS,
  CSS, service worker, and hero asset had identical SHA-256 hashes.
- `npm run verify:live-checkout` found the public USD 39.00 product and an
  unpaid HTTP 303 redirect to a hosted Dodo session. No payment was submitted.

The documented API allowance is **40 requests per first
`X-Forwarded-For` client address**. A fresh client produced:

```text
41 concurrent requests: 40×404, 1×429
100 concurrent requests: 40×404, 60×429
Every limited response: Retry-After: 1
After one idle second: ordinary 404 response
```

The local optimized binary started in an otherwise empty environment with
only `PATH` and `PORT=18082`. `/health` returned `build_sha=dev`; `/demo`
returned 200; an unauthenticated report write returned 402; and an invalid
report ID returned 404. The concurrent limiter and validation tests use
shared SQLite state. The singleton deployment contract prevents the
replica-local persistence split found in verification 9.

A real paid purchase/refund was not performed because this verification did
not authorize a financial transaction. Valid/revoked provider states remain
fixture territory.

## Privacy, response headers, and caching

An independent demo edit, reset, export, leave-demo, invalid-input, and valid
recovery flow made six requests. Every request was same-origin; there were no
`/api` writes, external requests, capture APIs, console errors, or page errors.
The separate explicit license check sent only the entered token to
`api.sociobot.in`, as disclosed.

Playwright and direct response inspection confirmed:

- CSP includes `frame-ancestors 'none'` as a response header and restricts
  scripts/styles to self.
- `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a
  permissions policy disabling camera, microphone, and geolocation.
- HTML and `service-worker.js` use `Cache-Control: no-cache`.
- hashed JS/CSS/image assets use one-year immutable caching.
- a missing route returns the designed page with HTTP 404.
- `robots.txt` and `sitemap.xml` return 200.

`/opt/fleet/lib/verify-url.sh` passed `/` and `/?demo=1`: title, `lang=en`, one
`h1`, main landmark, alternatives for every image, labeled buttons, and no
console/page errors.

## Accessibility, keyboard, mobile, and PWA

- The live suite and independent AxeBuilder scans found zero serious or
  critical violations across public routes, desktop and 390 px, light and
  dark modes.
- The first Tab reaches the skip link. Its measured focus outline is solid
  3 px cobalt; Enter moves focus to `<main>`. Route/task changes move focus to
  the new heading and announce state.
- Forms have bound labels; setup errors use `role=alert`; async save/license
  messages use live regions.
- At 390 px, `scrollWidth=clientWidth=390`. Public routes also pass the 200%
  text-reflow suite. Radio inputs have associated clickable label regions over
  44 px.
- With reduced motion, maximum animation and transition duration is 0.01 ms.
- Service worker `registration.update()` completed with the worker active and
  controlling the page; no waiting worker remained. Cache
  `screenreader-task-audit-v5` was active. The populated demo reloaded offline.
- Visual inspection found no clipping, overlap, or hidden actions. The
  risograph evidence-desk design matches `.factory/design.md`.

Evidence: `verification-10-artifacts/demo-desktop.png`,
`verification-10-artifacts/demo-mobile-390.png`, and the two `verify-*`
folders.

## Performance

Fresh mobile Lighthouse on the live `/demo` route:

```text
Performance 99 · Accessibility 100 · Best Practices 100 · SEO 100
FCP 1.3 s · LCP 1.4 s · TBT 120 ms · CLS 0 · total transfer 52 KiB
```

Evidence: `verification-10-artifacts/lighthouse-live.json`.

### Low — text assets are not compressed on the wire

Lighthouse reported “Enable text compression” with about 35 KiB estimated
savings. The small bundle keeps performance at 99 and all hard budgets pass,
so this is not independently release-blocking.

### Low — the landing illustration has no responsive source set

The hero uses one 1200×800 WebP in a plain `<img src>`. It is below the 300 KB
hero budget and has explicit dimensions and useful alternative text, but it
does not provide the AVIF/WebP/fallback `picture` treatment or responsive
`srcset` required by the attached image-generation guidance.

## Scope notes

This is a web-with-backend PWA, not a library or CLI, so package-consumer
installation does not apply. It has no sign-in flow, so the Microsoft Entra
authority check does not apply. AI would not improve this intentionally
manual, privacy-preserving evidence job; import/export, offline use, and team
sharing are already the useful leverage points.

## Retest

1. Resolve every unlisted public claim and complete the copy inventory.
2. Re-run every exact command in `.factory/claims.json` after `npm ci`.
3. Re-run `npm test`, `cargo test`, the candidate-labeled build comparison,
   full live Playwright suite, and the 41/100-request public rate probes.
4. Re-run Lighthouse if text compression or responsive image delivery changes.
