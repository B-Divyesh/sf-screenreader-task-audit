# Repair 6 handoff — Screenreader Task Audit

**Date:** 2026-08-29

**Deployment class:** `web-with-backend` container, Rust/axum + SQLite + Vite frontend
**Live URL:** <https://screenreader-task-audit.sociobot.in>

## What changed

- Increased Playwright's development-server allowance to five minutes and made
  browser tests serial. A cold Rust build took 66 seconds in this environment,
  so the former 60-second default made valid claim commands fail from a clean
  checkout.
- Made the visible report and accessible HTML export lossless for captured
  reproduction evidence: starting place, other notes, and every trace event
  are retained alongside the existing observations.
- Repaired keyboard continuity in the audit workspace. Switching tasks moves
  focus to the new task heading and announces it; opening, recording, and
  closing a trace form returns focus to the useful control and announces the
  state change.
- Made the build identifier wrap at 200% text zoom on a 390 px viewport.
- Added the licensed team-sharing UI and client protocol: $39 one-time offer,
  Sociobot checkout return-token handling, local license restore, daily
  verification cache, server-authorized report creation, and a private shared
  report URL. Creating a share is always an explicit action; the free local
  workflow and demo never send audit data to the backend.
- Kept the API limiter deterministic in production by applying the repository
  scale contract (`minReplicas=1`, `maxReplicas=1`) after the factory container
  helper, which otherwise defaults to three maximum replicas.

## Regression coverage

- `@claim:core-workflow` now records a trace and asserts the exact evidence in
  the on-screen report.
- `@claim:html-export` now asserts exact starting-place, notes, and trace
  values in the exported file; `tests/model.test.ts` adds the matching unit
  contract.
- `@claim:team-sharing` exercises the returned license token, local storage,
  the visible price/checkout/legal copy, and the authorized share payload with
  a recorded Sociobot verification fixture.
- Browser coverage asserts focus and live-region behavior for task switching
  and trace controls, all public core routes at 200%/390 px, dark-mode axe,
  and no page errors on public routes.

## Verification evidence

All commands below passed from the repaired source. The clean claim proof was
run after `cargo clean`; its cold Rust compilation took 1m06s and the command
completed inside the new five-minute Playwright allowance.

```text
npm ci                                                       PASS; 0 vulnerabilities
cargo clean && npm run test:e2e -- --grep @claim:demo-sandbox PASS; 2 browser projects
npm test                                                     PASS; 5 unit + 44 browser tests
all 15 exact .factory/claims.json commands                  PASS
cargo test                                                   PASS; 8 tests
npx tsc --noEmit                                             PASS
cargo fmt --check                                            PASS
cargo clippy --all-targets --all-features -- -D warnings    PASS
npm run build                                                PASS; dist/ produced
cargo build --release                                        PASS
npm audit --omit=dev                                         PASS; 0 vulnerabilities
```

Browser/accessibility/privacy/offline checks:

- Full live suite: `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e` — **PASS, 44/44**.
- The offline claim (fresh sample demo, then offline reload) passed; the
  service worker shell remains precached and activated.
- Light and dark axe coverage on desktop and 390 px passed with no violations.
  The standalone `@axe-core/cli` attempt could not create a ChromeDriver
  session against this image's Playwright Chromium, so the passing Playwright
  axe integration is the retained evidence.
- `/opt/fleet/lib/verify-url.sh` passed live `/` and `/demo`: HTTP 200, one
  `h1`, `lang=en`, main landmark, image alternatives, labeled buttons, and
  zero console/page errors.
- Live mobile Lighthouse (`/demo`): **100 Performance, 100 Accessibility,
  100 Best Practices, 100 SEO**; FCP 1.1 s, LCP 1.3 s, TBT 40 ms, CLS 0.
- Local release binary started with only `PORT` and `PATH`; `/health` served
  the build identity. Local unauthenticated sharing returned 402, oversized
  bodies returned 413, and cache/CSP headers were checked.

Rate-limit and deployment checks:

```text
EXPECTED_BUILD_SHA=ed524a05953bbcd1fbb7df6e595164cc908dbd54 npm run verify:live-deployment
PASS; health identity matched, minReplicas=1, maxReplicas=1

npm run verify:live-rate-limit
PASS; 41 concurrent = 40×404 + 1×429
PASS; 100 concurrent = 40×404 + 60×429; idle recovery = 404
```

The same live rate-limit probe was repeated and retained the exact boundary.
The final source commit is deployed again after this handoff is committed; use
the command below with `git rev-parse HEAD` to verify its exact stamped build.

## Run and verify locally

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo build --release
PORT=8080 ./target/release/screenreader-task-audit
```

For the live instance:

```sh
EXPECTED_BUILD_SHA="$(git rev-parse HEAD)" npm run verify:live-deployment
npm run verify:live-rate-limit
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
```

## Known external dependency

The product code now implements the documented Sociobot/Dodo purchase and
license protocol, but the factory-owned endpoint
`https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout`
currently responds `404 {"error":"enabled factory product"}`. This prevents
an actual purchase despite the client integration being covered by the recorded
fixture. Product repository rules prohibit this worker from registering or
changing billing. The factory must enable/register the product in Sociobot
before presenting the paid checkout as a live purchasable offer; no payment
provider, card field, analytics, or secret was added to this repository.

## No remaining code-side gaps

No library/package consumer check applies to this web-with-backend product. No
accounts or external identity flow is used. Docker was statically verified as
multi-stage, non-root, PORT 8080, and build-argument stamped; this environment
does not provide Docker or Podman for a local container run.
