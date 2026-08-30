# Screenreader Task Audit — repair 10 handoff

**Status: READY TO RELEASE**

**Date:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-repair-10`

**Base assessed by the verifier:** `cfe3aad49823790c3138f61912b6336f2ce7c7d9`

**Verifier report:** `a941a916b2d3ed436cdc2936a207e033e38156a2` / `.factory/verification-13.md`

**Repair commit deployed:** `91a93b133a13a87c8af67faf15a8882a16c617e8`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

## Repair

The release blocker was in the container deployment path, not the shipped
Axum/Vite application. The repository already declared the required one-replica
Azure File topology in `.factory/container-scale.json`, but the generic
container deployer discarded it and sent its generic `maxReplicas: 3` template
without a volume mount.

- Added `scripts/container-app-template.py`. It validates this product's
  deployment contract and emits the full Azure Container Apps template: the
  exact image and port, a single ready replica, the `audit-data` Azure File
  volume, and the `/app/data` mount.
- The factory container deployer now calls that generator for products with a
  checked-in container contract, preventing its generic three-replica fallback
  from removing SQLite's persistence boundary.
- Added `tests/container-app-template.test.ts`. It proves the checked-in
  contract produces the exact live-template shape and rejects the
  release-blocking missing-volume shape. Existing topology tests continue to
  reject `maxReplicas: 3`, a missing durable mount, and a wrong candidate image.
- Built and deployed repair image
  `sociobotregistry.azurecr.io/sf-screenreader-task-audit:91a93b133a13`.

The existing application fixes were preserved: direct SPA document routes
return 200, unknown paths return a real 404, hashed assets are immutable,
HTML/service-worker responses revalidate, and the SQLite limiter uses the first
`X-Forwarded-For` address.

## Live repair evidence

```text
EXPECTED_BUILD_SHA=91a93b133a13a87c8af67faf15a8882a16c617e8 npm run verify:live-deployment
deployment verified: one active ready revision; minReplicas=1 maxReplicas=1;
durable volume mounted; image=sociobotregistry.azurecr.io/sf-screenreader-task-audit:91a93b133a13;
health={"status":"ok","build_sha":"91a93b133a13a87c8af67faf15a8882a16c617e8"}

npm run verify:live-rate-limit
rate-limit verified: concurrent 41=40x404/1x429; concurrent 100=40x404/60x429;
idle recovery=404

npm run verify:live-checkout
checkout verified: catalog USD 39.00; 303 to hosted Dodo session
```

Direct live requests returned 200 for `/`, `/demo`, `/audit`, `/privacy`,
`/terms`, `/report`, `/demo/report`, and `/share/<32-hex-id>`; `/not-a-route`
returned 404. The current fingerprinted JavaScript returned
`Cache-Control: public, max-age=31536000, immutable`; `service-worker.js`
returned `Cache-Control: no-cache`. The ACR production build succeeded as run
`ch1dv`.

The live URL smoke JSON and desktop/390 px captures are in
[`repair-10-artifacts/verify-live/`](repair-10-artifacts/verify-live/).

## Verification completed

| Check | Result |
| --- | --- |
| Clean install | `npm ci` passed; 60 packages audited, 0 vulnerabilities |
| Unit, integration, desktop, and 390 px mobile | `npm test`: 10 Vitest tests and 58 Playwright tests passed |
| Manifest claims | All 21 `.factory/claims.json` commands rerun independently and passed: 18 browser claim commands plus 3 Rust claim commands |
| Rust backend | `cargo test`: 13 passed; `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo build --release` passed |
| Type/build/security | `npx tsc --noEmit`, `npm run build`, `npm audit`, and `npm audit --omit=dev` passed; build emitted 40.13 KB JS (12.26 KB gzip) and 10.91 KB CSS (3.44 KB gzip) |
| Clean runtime contract | The release binary started from `env -i PORT=18080`; `/health` returned `dev`, all documented direct routes returned 200, unknown route returned 404, and assets had immutable caching |
| Live browser suite | `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e -- --retries=0`: 56 passed; 2 local-recorded-license fixture cases skipped by design |
| Accessibility and keyboard | Playwright Axe found no serious/critical findings on public routes and the 404; skip link, Enter/Space flows, route-heading focus, 44 px targets, 200% text reflow, reduced motion, and 390 px layout passed |
| Privacy, offline, and update | Claim tests passed for first-party-only local audit traffic, demo/saved-audit offline reload in separate contexts, and service-worker update behavior |
| URL smoke | `/opt/fleet/lib/verify-url.sh` reported HTTP 200, no console errors, title `Screenreader Task Audit — record task evidence`, `lang=en`, one h1, one main, and no missing image alt text |
| Lighthouse mobile | `/?demo=1`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,130 ms, FCP 1,101 ms, TBT 9 ms, CLS 0 |

This is a web-with-backend product, so package/consumer installation is not
applicable. Checkout was verified only through the safe hosted-Dodo redirect;
no card data, purchase, or refund was submitted. Recorded license fixtures
cover create, invalid, and revoked-license behavior without spending money.

## Run and verify

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
npm run build
cargo build --release
EXPECTED_BUILD_SHA=91a93b133a13a87c8af67faf15a8882a16c617e8 npm run verify:live-deployment
npm run verify:live-rate-limit
npm run verify:live-checkout
```

## Known gaps

None. The live application is on the repair image, has one durable SQLite
writer, and enforces the documented public API allowance.
