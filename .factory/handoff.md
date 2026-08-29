# Repair 7 handoff — PASS

**Date:** 2026-08-29
**Repaired candidate:** `6fd6ece481e96a5d88f280909781ac74a2914535`
**Repair source commit:** `8882430ffa25cdf9ba5b102cf29e20a5cccdcd03`
**Verifier report repaired:** `cc10e8df0833312094200acd38778bf7507efae2`
**Live URL:** <https://screenreader-task-audit.sociobot.in>
**Live revision:** `sf-screenreader-task-audit--0000033`
**Live image:** `sociobotregistry.azurecr.io/sf-screenreader-task-audit:8882430ffa25`

## Result

All three release-blocking findings in `verification-9.md` were reproduced and
repaired. The deployed revision is healthy, reports the exact repair SHA at
`/health`, uses the required singleton topology, and passes the public rate
boundary and checkout preflight checks.

## Repairs

### Singleton stateful deployment and rate boundary

The repository's existing `.factory/container-scale.json` already required one
replica because report and rate-limit state are SQLite-backed. The factory
container deploy helper had been ignoring that contract and always sending
`maxReplicas: 3`. The deployment was performed after correcting that helper to
read and validate the repository scale contract. Azure now reports
`minReplicas: 1`, `maxReplicas: 1` for the live revision.

`RATE_LIMIT_CLIENT_IP=198.51.100.254 npm run verify:live-rate-limit` produced
40 ordinary responses and 1 `429` from a concurrent 41-request probe, then 40
ordinary responses and 60 `429` responses (each with `Retry-After: 1`) from a
100-request probe. The same forwarded client recovered after an idle second.

### Team-sharing checkout

Registered the live Dodo one-time product **Screenreader Task Audit Team
Sharing** at USD 39.00 and its enabled Sociobot factory-product mapping for
`screenreader-task-audit`. The public catalog now exposes the product and the
unpaid checkout request returns `303` to a hosted Dodo checkout session rather
than the prior 404.

Added `scripts/verify-live-checkout.sh`, `npm run verify:live-checkout`, and
expanded the `@claim:team-sharing` browser regression to assert the public
catalog entry, exact USD 39.00 price, and hosted checkout redirect. The check
does not submit payment details or create a charge.

### License restore feedback and persistence

License verification is now token-bound: an old cached verdict cannot approve
a different token. Invalid or failed checks do not persist the token. The
landing and report restore forms render an atomic polite status region, retain
focus in the token field on failure, and give a plain recovery instruction.
Positive verification alone persists the token and reports success.

Added `@claim:license-restore-feedback`, covering the invalid result's
semantics, announcement, focus, and storage boundary plus the valid path.
The copy audit now records all new user-facing status sentences.

## Verification evidence

Clean local install and release gates:

```text
npm ci                                                    PASS; 0 vulnerabilities
npm test                                                  PASS; 5 unit + 46 browser tests
cargo test                                                PASS; 8 tests
npx tsc --noEmit                                          PASS
cargo fmt --check                                         PASS
cargo clippy --all-targets --all-features -- -D warnings  PASS
npm run build                                             PASS; dist/ produced
cargo build --release                                     PASS
npm audit --omit=dev                                      PASS; 0 vulnerabilities
```

The release binary was started with a clean environment containing only `PATH`
and `PORT=18081`; `/health` returned `build_sha: dev` and an unknown report
returned 404. The local release site passed `verify-url.sh`.

Focused regression and live checks:

```text
npm run test:e2e -- --grep @claim:team-sharing                    PASS; desktop + 390 px
npm run test:e2e -- --grep @claim:license-restore-feedback        PASS; desktop + 390 px
EXPECTED_BUILD_SHA=8882430... npm run verify:live-deployment      PASS
RATE_LIMIT_CLIENT_IP=198.51.100.254 npm run verify:live-rate-limit PASS
npm run verify:live-checkout                                      PASS
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
                                                               PASS; 46 tests, desktop + 390 px
/opt/fleet/lib/verify-url.sh <live / and /demo>                   PASS
```

The live browser suite covers the one-click demo, real-data workflow, all
claims, keyboard-only task and trace actions, skip link and focus return,
desktop and 390 px layouts, dark mode, route/back navigation, offline reload
and service-worker update, privacy request boundaries, and Axe serious/critical
violations. It logged no console or page errors.

Local release Lighthouse on `/demo` recorded Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.1 s, LCP
1.2 s, TBT 70 ms, CLS 0. The production build is 40.16 KB JavaScript (12.28
KB gzip) and 10.91 KB CSS (3.44 KB gzip).

Live response-policy checks confirmed `Content-Security-Policy` with response
header `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict
referrer and permissions policies, and `no-cache` for HTML and the service
worker. Hashed assets are covered by the production browser/offline tests.

The standalone `@axe-core/cli` could not start its Selenium Chrome session in
this container even when pointed at Playwright Chromium. The project’s pinned
Playwright AxeBuilder suite ran successfully against every public route in both
viewports and themes, so no accessibility result depends on that unavailable
launcher.

## Deployment and operational note

ACR build `ch15n` completed successfully and deployed image digest
`sha256:4b9d…` as revision `0000033`. Live `/health` returns the full source
SHA `8882430ffa25cdf9ba5b102cf29e20a5cccdcd03`.

The generic factory deployment helper should retain the scale-contract reader
used for this deployment so a future redeploy cannot accidentally replace the
required singleton topology. The product repository continues to carry the
authoritative checked-in scale contract and backend regression for it.

No production payment was submitted during repair: the safe public preflight
verifies product registration and the hosted checkout handoff without charging
a card. Valid-license and revoked-license behavior retain recorded gateway
fixture coverage; the next real purchase will exercise the provider webhook in
production.

## How to run

```text
npm ci
npm test
cargo test
npm run build
cargo build --release
npm run verify:live-deployment
npm run verify:live-rate-limit
npm run verify:live-checkout
```

Use `/demo` for the isolated sample-data workflow. `README.md` documents local
development, the backend, deployment, and the privacy boundary.
