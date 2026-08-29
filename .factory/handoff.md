# Screenreader Task Audit — polish 1 handoff

## Status: deployed and verified

Runtime repair commit: `1e31b77a8fc5df228e6fee7db7f0823ac0af56b8`.

The deployed Container App runs `sociobotregistry.azurecr.io/sf-screenreader-task-audit:1e31b77a8fc5-sha`, revision `sf-screenreader-task-audit--0000009`, with one replica. At handoff, <https://screenreader-task-audit.sociobot.in/health> returned that exact build SHA.

## What changed

- Added an isolated one-click `?demo=1` flow with banner, reset, and discard-on-leave behavior.
- Fixed demo/real active-task isolation and added full persistence coverage.
- Rewrote first-screen and supporting copy in plain words; added the verb-first catalog description.
- Removed the unavailable paid checkout and unsupported 30-day link promise.
- Added JSON import with schema validation, five-task cap, preview, and explicit restore.
- Added complete claims inventory and observable claim tests.
- Added per-route metadata, real static 404 shell, sitemap routes, external-link cues, and 44 px link targets.
- Preserved the risograph evidence-desk visual system and original generated artwork.

## Verification

Fresh clone `/tmp/sra-clean-1`:

```sh
npm ci
npm test                    # 3 unit + 30 browser runs passed
cargo test                  # 7 backend tests passed
```

Repository checks:

```sh
npm run build               # dist/ emitted; JS 10.09 KB gzip, CSS 3.42 KB gzip
npx tsc --noEmit
npm test                    # passed
cargo test                  # 7 passed
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo build --release
```

Every command listed in `.factory/claims.json` was run after `npm ci`; browser claim commands passed in desktop Chromium and the 390 × 844 mobile project. Live `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e` passed all 30 browser runs.

Live cold checks also confirmed:

- `?demo=1` loads the isolated sample with its persistent banner.
- `/`, `?demo=1`, `/demo/report`, `/audit`, `/report`, `/privacy`, `/terms`, and `/missing` have the expected titles, landmarks, focus behavior, and no serious/critical Axe findings.
- The 390 px live demo has no horizontal overflow; screenshots are in `.factory/evidence/`.
- Fixed-IP live rate burst: 40 × 404, 60 × 429, and every limited response carried `Retry-After: 1`.
- The server returns `200` for known routes, a real `404` for unknown routes, and build SHA `1e31b77a8fc5df228e6fee7db7f0823ac0af56b8` from `/health`.

## Known gaps

None. Team sharing is deliberately not offered until the factory registers a checkout product and provisions durable shared storage; this repair makes no paid or durability claim.
