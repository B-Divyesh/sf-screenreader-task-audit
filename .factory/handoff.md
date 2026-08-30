# Screenreader Task Audit — verification 14 handoff

**Status: PASS — READY TO RELEASE**

**Date:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-verify-14`

**Tested candidate:** `aac4bdc8ebb22aafe7978d18ecf226bf62542162`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Full report:** [.factory/verification-14.md](verification-14.md)

## Verdict

The candidate is correctly deployed and passes the acceptance contract. The
free audit works end to end, the public API allowance and durable one-replica
topology are enforced, and the final live suite and checkout verification pass.

The Sociobot catalog and checkout did return HTTP 500 for several minutes in
the middle of QA. This caused one live-suite run to finish 54 passed, 2 skipped,
and 2 failed. It recovered without a candidate change. The exact payment claim
then passed in both browser projects, the checkout verifier confirmed USD 39
and the 303 Dodo handoff, and the complete no-retry live rerun finished **56
passed, 2 fixture-only skips, 0 failed**. This transient is retained as a medium
operational finding, not concealed as a clean first attempt.

## What passed

- All 21 exact `.factory/claims.json` commands passed from the clean candidate
  checkout before broader QA.
- Cold first-read and one-click sample demo gates passed at desktop and 390 px.
- `npm test`: 10 Vitest and 58 Playwright tests passed locally.
- `cargo test`: 13 passed; TypeScript, Rust formatting, clippy, Vite production
  build, release backend build, and both npm audits passed.
- Independent free-audit use covered invalid setup and recovery, input
  boundary, keyboard consent, a blocked critical task, trace validation,
  export, persistence, and private-data request inspection.
- Axe found no serious/critical findings across six routes in desktop light and
  mobile dark; keyboard focus, 44 px targets, 200% reflow, reduced motion, and
  normal-route console/page errors passed.
- Service-worker update and offline demo reload passed.
- Fresh landing Lighthouse: 99 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; LCP 1.83 s, TBT 0 ms, CLS 0.
- Live identity matches the candidate through `/health`, footer, image tag, and
  byte-identical JS.
- Live topology is now one healthy replica with its durable `/app/data` volume.
- The API limiter produced 40 ordinary responses followed by 429 responses
  with `Retry-After: 1`, then recovered after one idle second.
- Final live checkout verification found the USD 39.00 catalog entry and a 303
  redirect to a hosted Dodo session.

## Findings

- **Medium:** The upstream billing catalog/checkout had a roughly nine-minute
  5xx window during QA, then recovered. Monitor and alert on billing 5xx rates.
- **Low:** Generated illustration provenance is documented internally but not
  disclosed in the public footer.

## Reproduce

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
VITE_BUILD_SHA=aac4bdc8ebb22aafe7978d18ecf226bf62542162 npm run build
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e -- --retries=0
EXPECTED_BUILD_SHA=aac4bdc8ebb22aafe7978d18ecf226bf62542162 npm run verify:live-deployment
npm run verify:live-rate-limit
npm run verify:live-checkout
```

Docker-compatible image tooling was unavailable in this verifier container, so
the Dockerfile was inspected but not rebuilt locally. No product code was
modified.
