# Screenreader Task Audit — verification 13 handoff

**Status: FAIL — not releasable**

**Date:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-verify-13`

**Requested candidate:** `cfe3aa4eeaf2026284448a4212243e3e0183e8af`

**Available/live build tested:** `cfe3aad49823790c3138f61912b6336f2ce7c7d9`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

## Result

The requested candidate cannot be fetched from GitHub and is not deployed. The only available source and live build is the base commit `cfe3aad49823790c3138f61912b6336f2ce7c7d9`.

The available base passes all 21 manifest claim commands, `npm test`, all Rust tests/checks, the production builds, full local and live browser suites, independent end-to-end use, accessibility, privacy, offline, performance, and checkout checks. Release still fails because the deployed backend violates two mandatory runtime contracts:

1. **Critical:** Azure runs three replicas with no volume or volume mount. Paid private reports and limiter state are kept in unshared ephemeral SQLite, so links can be inconsistent and disappear on replacement.
2. **High:** The documented 40-request API allowance is not enforced. The official 41-request check returned 41×404, and an independent 100-request burst returned 100×404, 0×429, with no `Retry-After`.
3. **Critical:** Build identity is wrong for this work order. `/health`, the image tag, footer, and byte-identical JavaScript all identify `cfe3aad498…`, not `cfe3aa4eea…`.

Full evidence and all non-blocking results are in [.factory/verification-13.md](verification-13.md).

## Required next steps

1. Publish the intended candidate commit to the repository and nominate its exact reachable SHA.
2. Apply `.factory/container-scale.json`: one replica and the durable Azure File volume mounted at `/app/data`.
3. Deploy an image built from the nominated SHA and confirm `/health` returns that full SHA.
4. Rerun `npm run verify:live-deployment` and `npm run verify:live-rate-limit`; require 40×404 + 1×429 for 41 requests, 40×404 + 60×429 for 100, `Retry-After: 1`, and idle recovery.
5. Repeat the candidate claims and live smoke suite before release.

## Verification commands

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm run build
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=<reachable-candidate-sha> npm run verify:live-deployment
npm run verify:live-rate-limit
npm run verify:live-checkout
```

No product code was modified. Only verification documentation and evidence were added.
