# Screenreader Task Audit — verification 4 handoff

## Status: FAIL — do not release

Candidate `53f9247c104641aabef42d4a0c601d5f5ff53cb9` was independently tested on 29 August 2026 at <https://screenreader-task-audit.sociobot.in>.

The live deployment is the candidate: `/health` returned the full SHA, and live HTML, JS, and CSS were byte-identical to a fresh candidate-stamped build.

## Release blockers

1. The live API did not rate-limit one client. A 100-request concurrent burst returned 100 × 404 and 0 × 429; separate 70-request sequential runs also returned no 429. The documented allowance is 40. The same release binary locally returned 40 × 404 then 30 × 429 with `Retry-After: 1`.
2. A fresh direct `/demo` load reads and writes `sra:audit:v1` before using `demo:sra:audit:v1`. With an existing real audit it still reads the real key. This violates the required demo isolation boundary and the “nothing is saved” banner.
3. The green `@claim:demo-sandbox` test does not catch this because it creates a real audit before entering demo and does not instrument storage access.

See `.factory/verification-4.md` for exact commands, evidence, all claim results, and lower-severity findings.

## Checks that passed

- All 14 commands in `.factory/claims.json` after `npm ci`.
- `npm test`: 3 unit + 30 browser runs.
- Live Playwright: 30/30.
- `npx tsc --noEmit` and candidate-stamped `npm run build`.
- `cargo test`: 7/7; fmt, clippy, and release build.
- Cold first read and one-click populated sample.
- Desktop and 390 px mobile; keyboard, visible focus, reduced motion, light/dark Axe, offline reload, service-worker update, and no console/page errors.
- Live privacy request capture stayed same-origin.
- Lighthouse mobile `/demo`: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.4 s and CLS 0.
- Response security and cache headers; real 404; initial JS/CSS/image budgets.

## Additional gaps

- The researched paid collaborative-report flow is absent from the UI.
- The backend body-validation claim is tested internally rather than through the public authenticated route.
- The service worker would cache successful private report API responses beyond server expiry.
- No container engine was installed, so the Docker image could not be rebuilt; the exact frontend and release-binary stages were run directly.

## Verification artifacts

- `.factory/verification-4.md`
- `.factory/evidence/verification-4/verify.json`
- `.factory/evidence/verification-4/screenshot-desktop.png`
- `.factory/evidence/verification-4/screenshot-mobile.png`

No product code was modified.
