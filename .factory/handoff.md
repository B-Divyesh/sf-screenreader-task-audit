# Verification 10 handoff — FAIL

**Date:** 2026-08-29

**Candidate:** `13221a5fbf4b8d29b93e22acc5735fc8552178c4`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Full report:** [verification-10.md](verification-10.md)

## Result

**FAIL.** The exact candidate is live and the product is operational, but the
release contract forbids unlisted visitor-facing claims. The footer promises
to “fix blockers,” the offline status promises saved-audit operation, the paid
section promises accessibility features stay free, and the terms promise
refund-driven license revocation. Those statements do not each have an exact
`.factory/claims.json` entry and tagged sandbox test. The footer is also absent
from the mandatory landing copy inventory.

No product code was modified. This verification changed only Factory reports
and evidence.

## Severity summary

- **High / release blocking:** claims manifest and copy audit omit shipped
  claims. Remove/narrow the copy or add exact claim entries and observable
  `@claim:<id>` tests.
- **Low:** live JS/CSS are not compressed; Lighthouse estimates about 35 KiB
  savings. Current mobile performance remains 99.
- **Low:** the landing hero is a single WebP without responsive `srcset` or an
  AVIF/WebP/fallback source set. It remains below the 300 KB budget.

## What passed

- First-read gate and one-click isolated demo.
- All 16 listed claim commands after clean `npm ci`.
- `npm test`: 5 unit and 46 Playwright tests.
- Full live Playwright suite: 46 tests across desktop and 390 px.
- TypeScript, Rust formatting, Clippy with warnings denied, 8 backend tests,
  exact Vite build, optimized Rust build, and npm audit.
- Exact candidate identity at `/health` and in the footer; live frontend files
  match a candidate-labeled local build byte for byte.
- Live singleton topology, checkout preflight, and exact API allowance:
  40 ordinary requests, then 429 with `Retry-After: 1`, with idle recovery.
- Independent normal, invalid, recovery, reset, export, privacy, keyboard,
  mobile, dark-mode, 200% text, reduced-motion, service-worker update, and
  offline reload checks.
- Zero serious/critical Axe findings and zero console/page errors.
- Mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.4 s, TBT 120 ms, CLS 0.

## How to reproduce

```text
npm ci
npm test
cargo test
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
EXPECTED_BUILD_SHA=13221a5fbf4b8d29b93e22acc5735fc8552178c4 npm run verify:live-deployment
RATE_LIMIT_CLIENT_IP=<unused-test-address> npm run verify:live-rate-limit
npm run verify:live-checkout
```

Use <https://screenreader-task-audit.sociobot.in/demo> for the isolated sample
workflow. Evidence is in `.factory/verification-10-artifacts/`.

## Remaining verification limitation

No real purchase or refund was submitted. Checkout registration and hosted
handoff were verified safely; provider-valid, invalid, and report-creation
states have fixture coverage, and a real invalid token was checked live.
