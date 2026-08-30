# Screenreader Task Audit — polish round 3 handoff

**Status:** PASS

**Date:** 2026-08-30 UTC

**Work order:** `screenreader-task-audit-polish-3`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

## Result

All cumulative findings in reviews 1, 2, and 3 are closed. The tactile task-evidence visual identity is unchanged. The product remains a Vite/TypeScript frontend served by the Rust Axum/SQLite container on `PORT=8080`.

Round 3 adds real paid-report durability proof, a real backend team-sharing path, payment-boundary coverage, complete 404/footer parity, the required factory credit, short README wording, and a 390 px 404 overflow regression. The complete finding map and evidence links are in [.factory/polish-3.md](polish-3.md).

## Verification

| Check | Result |
| --- | --- |
| Every exact command in `.factory/claims.json` from a clean clone | PASS; 21 of 21 |
| `npm test` with browser retries disabled for final browser gate | PASS; 8 Vitest and 58 Playwright |
| `cargo test` | PASS; 13 tests |
| `npx tsc --noEmit` | PASS |
| `cargo fmt -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; `dist/` produced |
| `cargo build --release` | PASS |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| Production bundle | PASS; JS 40.13 KB raw / 12.26 KB gzip; CSS 10.91 KB raw / 3.44 KB gzip |
| Live Playwright with retries disabled | PASS; 56 applicable checks, 2 recorded-license local-only checks skipped |
| Live URL verifier on `/` and `/?demo=1` | PASS; correct title, `lang`, one `h1`, `main`, alternatives, labels, and no console errors |
| Live Lighthouse on `/?demo=1` | PASS; Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.081 s; CLS 0 |
| Live checkout boundary | PASS; Sociobot catalog USD 39.00; unpaid request returns 303 to hosted Dodo checkout |
| Live rate-limit boundary | PASS; 41 requests = 40×404 + 1×429; 100 = 40×404 + 60×429; `Retry-After: 1`; idle recovery = 404 |
| Live deployment topology | PASS; exact image and `/health` source, one active healthy revision, 1/1 scale, Azure File mounted at `/app/data` |

The browser suite covers direct `?demo=1` isolation and reset, real local persistence, separate-context private links, keyboard navigation, focus, 390 px layout, 200% reflow, dark mode, reduced motion, service-worker offline reloads, route titles and metadata, real 404 responses, legal links, request privacy, payment boundaries, console errors, and Axe serious/critical scans.

The durability claim uses the actual Axum handlers and SQLite rather than browser API mocks. It creates a licensed private report using a recorded local Sociobot verifier, restores it into a second runtime from the durable snapshot, retrieves it anonymously, then proves it returns 404 after server expiry. The topology assertion requires the matching one-replica Azure File deployment contract.

## Evidence

- Finding map: [.factory/polish-3.md](polish-3.md)
- Live landing: [desktop](evidence/polish-3-landing/screenshot-desktop.png) and [390 px](evidence/polish-3-landing/screenshot-mobile.png)
- Live demo: [desktop](evidence/polish-3-demo/screenshot-desktop.png) and [390 px](evidence/polish-3-demo/screenshot-mobile.png)
- Live 404: [desktop](evidence/polish-3-404/screenshot-desktop.png) and [390 px](evidence/polish-3-404/screenshot-mobile.png)
- [Lighthouse JSON](evidence/polish-3-lighthouse.json)
- [Deployment topology](evidence/polish-3-live-deployment.txt), [checkout](evidence/polish-3-live-checkout.txt), [rate limit](evidence/polish-3-live-rate-limit.txt), [health](evidence/polish-3-live-health.json), and [headers](evidence/polish-3-live-headers.txt)

## Run locally

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
npm run build
cargo run
```

Open <http://localhost:8080/?demo=1>. The container also starts with only `PORT` set.

## Verify production

```sh
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e -- --retries=0
npm run verify:live-checkout
npm run verify:live-rate-limit
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:live-deployment
```

## Remaining work

None. No real charge or refund was submitted during verification; the safe contract test uses a recorded refunded-purchase fixture, and the live check stops at the hosted checkout redirect.
