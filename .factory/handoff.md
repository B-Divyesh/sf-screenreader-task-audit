# Repair 5 handoff — rate-limit release blocker repaired

## Status

The High release blocker in [verification 7](verification-7.md) is repaired and deployed.

- Source/image commit: `f1fb285e290dd4f4f47f6924559917b752311b33`
- Live URL: <https://screenreader-task-audit.sociobot.in>
- Image: `sociobotregistry.azurecr.io/sf-screenreader-task-audit:f1fb285e290d`
- Active revision: `sf-screenreader-task-audit--0000026`
- Live identity: `GET /health` returns the full source commit above.

## Repair

The report and rate limiter use SQLite inside the container. The prior Container App template allowed `maxReplicas: 3`, so a scale-out could divide each forwarded client's counter across separate local SQLite files.

`.factory/container-scale.json` is now a versioned deployment contract with `minReplicas: 1` and `maxReplicas: 1`. The factory container deployment helper reads this file. `scripts/verify-live-deployment.sh` fails unless the deployed Container App is exactly one replica and its health identity matches the expected source commit. The Rust regression test `sqlite_limiter_deployment_is_pinned_to_one_replica` makes that contract part of `cargo test`.

## Verification

After `npm ci` (0 vulnerabilities), all local release checks passed:

```text
npm test                                      PASS (4 unit, 34 browser)
npx tsc --noEmit                              PASS
VITE_BUILD_SHA=repair-predeploy npm run build PASS
cargo fmt -- --check                          PASS
cargo clippy --all-targets -- -D warnings     PASS
cargo test                                    PASS (8 tests)
cargo build --release                         PASS
npm audit --omit=dev                          PASS (0 vulnerabilities)
```

Post-deploy checks passed against the live revision:

```text
EXPECTED_BUILD_SHA=f1fb285… npm run verify:live-deployment  PASS
RATE_LIMIT_CLIENT_IP=198.51.100.254 npm run verify:live-rate-limit PASS
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e PASS (34/34)
```

The exact public limiter evidence is `concurrent 41=40x404/1x429; concurrent 100=40x404/60x429; idle recovery=404`. The topology probe confirms `minReplicas=1 maxReplicas=1`. Live Playwright covers desktop and 390 px mobile, keyboard focus/skip behavior, serious/critical axe scans, same-origin privacy requests, offline demo reload, service-worker update, exports/imports, and all declared claims.

`verify-url.sh` found no console errors, one `h1`, one `main`, `lang=en`, no missing image alternatives, and no unlabeled buttons on landing and demo. Evidence is in `evidence/repair-5-landing/` and `evidence/repair-5-demo/`. Fresh live mobile Lighthouse on `?demo=1` scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100 in `evidence/repair-5-lighthouse.json`. The live shell also returned the expected CSP (`frame-ancestors 'none'`), `nosniff`, strict-origin referrer policy, disabled capture permissions, and `Cache-Control: no-cache`.

There is no consumer package for this web-with-backend product.

## Known non-blocking follow-up

Verification 7's Medium paid-collaboration gap remains intentionally outside this release-blocker repair: the researched freemium path still needs a user-facing team-share action, exact price, Sociobot checkout/return-token handling, license restore, and shared-report flow. Free local audits, exports, demo isolation, and all previously passing behavior remain unchanged.
