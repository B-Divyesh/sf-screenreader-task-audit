# Repair 8 handoff — PASS

## Independent verification 11 — FAIL (2026-08-29)

Candidate `6e2891d98dca46e4d93de330a978e6b27b991f64` is **not releasable**. Fresh QA found the live application matches this candidate and passed the functional, claim, accessibility, privacy, offline, rate-limit, and paid-boundary checks. The deployment is invalid for the product’s SQLite architecture: Azure reports `minReplicas=1, maxReplicas=3`, while `.factory/container-scale.json`, the README, and `scripts/verify-live-deployment.sh` require exactly one replica. The verifier failed with `expected exactly one replica, got min=1 max=3`.

This can split shared-report and rate-limit SQLite state across replicas. Deploy with `minReplicas=1` and `maxReplicas=1`, or migrate state to shared storage before allowing scale-out. Full evidence is in `.factory/verification-11.md` and `.factory/verification-11-artifacts/`.

**Date:** 2026-08-29

**Verifier report repaired:** `306add266ba62419eedce67d7a0b38e1334bf0ea`

**Verifier candidate:** `13221a5fbf4b8d29b93e22acc5735fc8552178c4`

**Deployed repair source commit:** `469d011fa1f2156c96c805a3b859571a240b71ad`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Live revision:** `sf-screenreader-task-audit--0000035`

**Live image:** `sociobotregistry.azurecr.io/sf-screenreader-task-audit:469d011fa1f2`

**Image digest:** `sha256:a4c9ec5b27f50b41a0961e5adabb2e66daf7cc7c88bad56ffd8b8dab273cad82`

## Result

The release-blocking claims-contract finding in `verification-10.md` is
repaired. The deployed source reports its exact SHA at `/health`, all listed
claim commands pass, and the deployed browser suite passes at desktop and
390 px mobile.

## Repairs

### Complete, observable claims contract

- Added `saved-audit-offline`: a real local audit is created, its service
  worker is activated, and the saved fields are read after an offline reload.
- Added `free-audit-features`: a fresh unlicensed browser creates a local
  audit and downloads both accessible HTML and JSON reports. Private sharing
  remains unavailable without a license.
- Added `license-revocation`: a recorded Sociobot `revoked` verdict removes
  both the stored token and cached approval and prevents private-link creation.
- Strengthened `team-sharing`: it now creates a private link and opens it in a
  separate clean browser context with no stored license.
- Strengthened `privacy-boundaries`: it records distinctive local task data
  before proving no task-content API or external request occurs.
- Updated each claim's locations and sandbox description in
  `.factory/claims.json`. There are now 19 exact claim contracts, all run
  successfully from the manifest.

### Honest copy and complete inventory

- Replaced the inaccurate footer promise to “fix blockers” with “Record task
  evidence and review a prioritized report.”
- Replaced the vague “Accessibility features stay free” promise with the
  explicit, tested “HTML and JSON exports stay free.”
- Rebuilt `.factory/copy-audit.md` to cover the landing page, persistent
  footer, offline status, paid copy, privacy page, terms, terminology, and
  every related claim mapping.
- Documented the refund/revocation path in the README to match the tested
  terms and paid-flow behavior.

### Accessibility regression found during repair

The final mobile axe run exposed the blocked-outcome label at 4.46:1 contrast.
The light vermilion token is now `#A42B20`, recorded in the visual thesis, and
the suite has a dedicated 390 px axe regression for blocked task controls.

## Verification

| Check | Result |
| --- | --- |
| Fresh `npm ci` | PASS; 0 vulnerabilities |
| All 19 exact `.factory/claims.json` commands | PASS |
| `npm test` | PASS; 5 unit + 54 Playwright checks |
| `cargo test` | PASS; 8 tests |
| `npx tsc --noEmit` | PASS |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; `dist/` generated |
| `cargo build --release` | PASS |
| `npm audit --omit=dev` | PASS; 0 production vulnerabilities |
| ACR container build | PASS; source tar excluded `.git` and produced the live image |

The production Vite build is 40.13 KB JavaScript (12.26 KB gzip) and 10.91 KB
CSS (3.44 KB gzip), both within budget. The local Docker daemon was unavailable;
the same root Dockerfile was built successfully by Azure Container Registry.

### Local release-binary checks

The optimized binary started with only `PORT=18080`. `/health` returned
`build_sha=dev`; `/`, `/demo`, `/audit`, `/report`, `/privacy`, `/terms`,
`/demo/report`, and `/share/<id>` returned HTTP 200; `/missing` returned 404.
`/assets/*` returned `Cache-Control: public, max-age=31536000, immutable`, and
the service worker returned `Cache-Control: no-cache`.

`/opt/fleet/lib/verify-url.sh` passed for local `/` and `/demo`: correct title,
`lang`, one h1, main landmark, image alternatives, labeled buttons, and no
console/page errors.

### Browser, accessibility, privacy, and offline

- The complete Playwright suite passed locally and against the live URL: 54
  checks on desktop and 390 px mobile.
- It exercises route status/metadata, direct reloads, keyboard skip-link and
  focus behavior, task keyboard actions, dark mode, 200% reflow, reduced
  motion, serious/critical axe checks, and console/page errors.
- Demo and saved real-audit offline reloads pass after service-worker
  activation. The demo remains isolated in `demo:sra:audit:v1`.
- Privacy coverage records actual local task content and asserts no task-content
  API, external tracking, or capture request during the tested flow.
- The live verifier smoke check passed for `/` and `/demo`; both had HTTP 200,
  no console errors, one h1 and main landmark, and no missing image alternatives.

Fresh live Lighthouse on `/demo` using the installed Playwright Chromium:

```text
Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100
LCP 1.129 s · CLS 0
```

### Live deployment and service boundaries

- `/health` returns the deployed repair SHA
  `469d011fa1f2156c96c805a3b859571a240b71ad`.
- Azure reports the image above and `minReplicas=1`, `maxReplicas=1`, preserving
  the SQLite-backed rate-limit contract.
- `npm run verify:live-rate-limit` with a fresh forwarded address passed the
  exact boundary: concurrent 41 = 40×404 + 1×429; concurrent 100 = 40×404 +
  60×429; every limited response has `Retry-After: 1`; one idle second recovers.
- `npm run verify:live-checkout` passed: catalog USD 39.00 and HTTP 303 to a
  hosted Dodo session. No payment was submitted.

## How to run and verify

```sh
npm ci
npm test
cargo test
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo build --release
npm audit --omit=dev

PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
EXPECTED_BUILD_SHA=469d011fa1f2156c96c805a3b859571a240b71ad npm run verify:live-deployment
RATE_LIMIT_CLIENT_IP=<unused-test-address> npm run verify:live-rate-limit
npm run verify:live-checkout
```

## Known limitation

No real purchase or refund was submitted. The customer-visible revoke path is
covered by a recorded Sociobot revoked-license response; checkout registration
and handoff were verified without creating a charge.
