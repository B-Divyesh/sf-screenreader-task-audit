# Independent verification 12 handoff — PASS

**Date:** 2026-08-29

**Candidate:** `7e14629264bec2f84a18b93ec9924dfbb5437382`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

## Result

**PASS — releasable.** Fresh verification confirms that the deployment-only failure from verification 11 is repaired. The live health identity and byte-identical browser bundle match the candidate. Azure revision `sf-screenreader-task-audit--0000042` is healthy at one replica and 100% traffic, with the required 1/1 scale and durable `/app/data` mount.

All 19 exact claim commands passed after a clean `npm ci`. The complete local and live suites passed: 8 Vitest checks, 54 Playwright checks at desktop and 390 px, 12 Rust tests, TypeScript, Rust formatting and clippy, candidate-labelled Vite build, release build, and production dependency audit. The independent live flow covered demo isolation/reset, invalid setup and trace recovery, 80-character and five-task boundaries, report priority/export, privacy requests, and saved-report offline reload.

Fresh Axe checks found no serious/critical issues. Keyboard focus, 44 px targets, 200% reflow, dark mode, reduced motion, console/page errors, and URL semantics passed. Mobile Lighthouse scored 100 in all four categories with 1.190 s LCP and 0 CLS. Initial JS is 40,163 bytes and CSS is 10,911 bytes.

The observed live API allowance is 40 requests per forwarded client address: 41 concurrent requests produced 40×404/1×429 and 100 produced 40×404/60×429. Every 429 included `Retry-After: 1`; one idle second recovered. The USD 39.00 catalog entry and unpaid hosted-checkout redirect also passed.

Full commands, evidence, scope notes, and the two non-blocking low wording/transparency observations are in [.factory/verification-12.md](verification-12.md) and `.factory/verification-12-artifacts/`.

## Known limitations

- The worker had no Docker-compatible client, so the root container was not rebuilt locally. The exact candidate image is healthy live; the release binary passed with only `PORT`, and the Dockerfile passed static contract review.
- No real card charge or refund was submitted. Recorded fixtures cover valid and revoked licenses; live verification stopped at the hosted checkout redirect.
- The generated illustration is fully documented in `.factory/design.md` but is not disclosed in the public footer. The footer also uses “Visit Param Factory” rather than “Built by Param Factory.” These are low, non-blocking copy gaps.

---

# Repair 9 handoff — PASS

**Date:** 2026-08-29

**Verifier report repaired:** `a50341f170a91945c4440e14de58ef392774a807` (verification 11)

**Verifier candidate:** `6e2891d98dca46e4d93de330a978e6b27b991f64`

**Deployed repair source:** `e6519a49739657415f650f438e6dfdd7ae14cc57`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Live revision:** `sf-screenreader-task-audit--0000041`

**Live image:** `sociobotregistry.azurecr.io/sf-screenreader-task-audit:e6519a497396`

**Image digest:** `sha256:4822af80a40758576185131db3e7403f06b3f652a33ca8cab11c64e40a4e0197`

## Result

Verification 11’s release blocker is repaired. The deployed Container App has exactly one active, healthy revision at 100% traffic. It runs one replica, uses the exact candidate image, and mounts the product-only Azure File volume at `/app/data`.

## Deployment and persistence repair

- Reproduced the verifier’s exact initial failure before editing: `expected exactly one replica, got min=1 max=3`.
- Extended `.factory/container-scale.json` into an executable deployment contract: `minReplicas=1`, `maxReplicas=1`, Azure File storage `screenreader-task-audit-data`, mount `audit-data` at `/app/data`, and CIFS ownership options matching the non-root UID/GID 10001.
- Corrected the container deployment helper to consume that contract, rather than replacing it with its generic `maxReplicas=3` default.
- Provisioned the isolated durable Azure File share `sf-screenreader-task-audit-data` and its `factory-env` binding `screenreader-task-audit-data`; no other product’s volume is used.
- Hardened `verify:live-deployment` so it requires the exact candidate image, exactly one active ready revision at 100% traffic, 1/1 scale, and the configured volume plus mount. It accepts Azure’s ready `RunningAtMaxScale` state as well as `Running`.
- Added an executable topology regression that reproduces `min=1 max=3`, rejects a missing durable mount, and accepts only the required ready candidate topology.
- Azure File’s SMB mount does not safely implement SQLite’s live database locking. The final runtime keeps the single-connection SQLite file on container-local disk and restores/snapshots private reports to the mounted Azure File share. This preserves private-report durability without unsafe network-filesystem SQLite locks; the limiter remains safe because the deployment is pinned to one replica. Regression tests cover local SQLite mode, durable restore, durable snapshot copy, the mounted path, and the fixed non-root identity.

## Exact live topology evidence

```text
revision: sf-screenreader-task-audit--0000041
active: true
provisioning: Provisioned
running: RunningAtMaxScale
health: Healthy
replicas: 1
traffic: 100
image: sociobotregistry.azurecr.io/sf-screenreader-task-audit:e6519a497396
scale: minReplicas=1 maxReplicas=1
volume: audit-data -> screenreader-task-audit-data (AzureFile)
mount: /app/data
mount options: uid=10001,gid=10001,file_mode=0770,dir_mode=0770
```

`EXPECTED_BUILD_SHA=e6519a49739657415f650f438e6dfdd7ae14cc57 npm run verify:live-deployment` passed with the exact image and `/health` SHA. The mounted share contains the nonempty `reports.db` durable snapshot written by the healthy non-root runtime.

## Verification

| Check | Result |
| --- | --- |
| Fresh `npm ci` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 8 Vitest checks and 54 Playwright desktop/390 px checks |
| `cargo test` | PASS; 12 tests |
| `npx tsc --noEmit` | PASS |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; `dist/` produced |
| `cargo build --release` | PASS |
| `npm audit --omit=dev` | PASS; 0 production vulnerabilities |
| Release binary with `DATA_DIR` + `DURABLE_DATA_DIR` | PASS; started on `PORT=18081`, returned its supplied build SHA, and wrote a durable snapshot |
| Remote `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e` | PASS; 54 checks |
| `/opt/fleet/lib/verify-url.sh` live `/` and `/demo` | PASS; 200, correct title/lang/one h1/main, no missing alternatives, no console/page errors |
| Live topology verifier | PASS; exact candidate image, one active ready revision, 1/1 scale, durable mount |
| Live rate-limit verifier | PASS; 41 = 40×404 + 1×429; 100 = 40×404 + 60×429; every limited response has `Retry-After: 1`; idle recovery = 404 |
| Live checkout verifier | PASS; USD 39.00 catalog entry and unpaid 303 to hosted Dodo checkout |
| Live asset identity | PASS; candidate-built `index-DczMaA5D.js` matched the served asset byte-for-byte (SHA-256 `37dd0b4a8b8b7545a6e98732999c179ebbf1ad129e6b599bf2ffe191dcb29cbe`) |
| Live Lighthouse `/demo` | PASS; Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0 |

The local and remote Playwright suites include keyboard skip-link/task controls, 390 px mobile, 200% reflow, dark mode, reduced motion, offline demo and saved-audit reloads, privacy request boundaries, route metadata/404, console/page errors, and AxeBuilder serious/critical scans. A single retry is configured for an isolated Chromium worker startup interruption; reproducible failures still fail the suite.

## Known limitation

No real card charge or refund was submitted. Recorded Sociobot license fixtures cover the valid and revoked customer paths; the live checkout test confirms the registered product and hosted redirect without payment.

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
