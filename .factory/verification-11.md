# Independent verification 11 — FAIL

**Candidate:** `6e2891d98dca46e4d93de330a978e6b27b991f64`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Verified:** 2026-08-29

**Work order:** `screenreader-task-audit-verify-11`

## Decision

**FAIL — not releasable.** The application is healthy and the served health identity and browser bundle match the candidate. The live deployment is configured for `maxReplicas=3`, although shared reports and API rate-limit state live in container-local SQLite. The checked-in container-scale contract and deployment verifier require exactly one replica.

```text
expected exactly one replica, got min=1 max=3
```

This can partition report and rate-limit state during a scale event. No product code was changed during verification.

## First read and demo gate — PASS

A cold desktop and 390 px visit plainly stated what it does (“Record screen-reader task evidence”), for whom (“blind founders and small teams fixing a critical dashboard task”), and what to do first (**Try it with sample data**; “See five filled tasks and a prioritized report”). One click opened the five-task sample with the persistent demo banner, **Reset demo**, and **Start for real**.

Screenshots: `verification-11-artifacts/live-first-read-desktop.png` and `verification-11-artifacts/live-first-read-mobile.png`.

## Mandatory claims — PASS (19/19)

`.factory/claims.json` exists. After clean `npm ci`, every listed browser claim was exercised through the documented demo/product entry point, and both exact Rust claim commands passed.

| Claims | Result |
| --- | --- |
| `demo-sandbox`, `core-workflow`, `structured-capture`, `five-tasks` | PASS |
| `team-sharing`, `license-restore-feedback`, `report-priority`, `html-export` | PASS |
| `json-export`, `anonymous-export`, `import-json`, `privacy-boundaries` | PASS |
| `offline-reload`, `saved-audit-offline`, `free-audit-features`, `license-revocation` | PASS |
| `manual-evidence-not-certification` | PASS |
| `backend-rate-limit` (`cargo test claim_backend_rate_limit`) | PASS |
| `backend-report-validation` (`cargo test claim_backend_report_validation`) | PASS |

## Quality and product checks — PASS

```text
npm ci                                                    PASS; 0 vulnerabilities
npm test                                                  PASS; 5 unit + 54 Playwright checks
PLAYWRIGHT_BASE_URL=https://… npm run test:e2e            PASS; 54 live checks
cargo test                                                PASS; 8 tests
npx tsc --noEmit                                          PASS
cargo fmt --check                                         PASS
cargo clippy --all-targets --all-features -- -D warnings  PASS
npm run build                                             PASS; dist/ produced
cargo build --release                                     PASS
npm audit --omit=dev                                      PASS; 0 production vulnerabilities
```

The full local and live browser suites cover normal audit creation, missing-consent and invalid-JSON recovery, every trace type, five-task boundary, reports/exports/imports, keyboard focus, 390 px, 200% reflow, dark mode, service-worker offline reload, console/page errors, and axe. Fresh live AxeBuilder scans had zero serious or critical findings. The first-screen request log had only same-origin HTML, JS, CSS, and the local image: no analytics, ads, third-party fonts/scripts, capture API, or task-content API request. Reduced-motion CSS limits movement to 0.01 ms.

Docker could not be independently built because the verifier image has no Docker client (`docker: command not found`). Static Dockerfile inspection passed: multi-stage build, non-root runtime, defaulted build identity, no `.git` dependency, and `PORT` exposure.

## Identity, headers, caching, rate limit, and paid boundary — PASS

- `/health` returned the exact candidate SHA.
- A candidate-labelled frontend build (`VITE_BUILD_SHA=6e2891… npm run build`) produced `index-CZWrQdC1.js`, byte-identical to the live asset (SHA-256 `40dcd749147dbb26c007baf81acdb8454efea12ae5434e43f22383e489102a6f`).
- Initial JS is 40,163 bytes (12,231 gzip); CSS is 10,911 bytes (3,448 gzip).
- HTML, client routes, 404, and service worker use `Cache-Control: no-cache`; hashed assets are one-year immutable. CSP (including response-header `frame-ancestors 'none'`), nosniff, strict-origin referrer policy, and a restrictive permissions policy were present.
- The observed API allowance is 40 requests per first `X-Forwarded-For`: 41 concurrent requests produced 40×404/1×429; 100 produced 40×404/60×429; every limited response had `Retry-After: 1`; one idle second recovered.
- `npm run verify:live-checkout` passed: catalog price USD 39.00 and an unpaid request got a 303 to hosted Dodo checkout. No charge was submitted.

## Release-blocking finding

### High — live replica maximum violates the SQLite persistence contract

`EXPECTED_BUILD_SHA=6e2891… npm run verify:live-deployment` confirmed the right health identity but exited non-zero because Azure reports `minReplicas=1, maxReplicas=3`. `.factory/container-scale.json` requires 1/1; the backend persists reports and limiter counters under `data/reports.db`; and the README explicitly requires one replica unless state moves to shared storage. A small live rate probe passing now does not make scale-out safe.

**Required repair:** deploy with `minReplicas=1` and `maxReplicas=1`, or migrate both persistence boundaries to shared storage and revise the architecture, tests, documentation, and deployment contract. Then rerun live deployment, rate-limit, and full browser verification.

## Scope notes

This is a web-with-backend PWA, not a library/CLI. It has no sign-in flow, so the Entra tenant check does not apply. Valid/revoked payment paths use recorded fixtures; no real purchase or refund was authorized.
