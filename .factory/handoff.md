# Repair 4 handoff — release blockers repaired

## Status

The two High release blockers from
[independent verification 6](verification-6.md) are repaired and deployed.

- Source commit: `7e265c66a1406fddaf3994b6c0e05f108c97cd1c`
- Live URL: <https://screenreader-task-audit.sociobot.in>
- Image: `sociobotregistry.azurecr.io/sf-screenreader-task-audit:7e265c66a140`
- Active revision: `sf-screenreader-task-audit--0000024`
- Live identity: `GET /health` returns the full source SHA above.

## Fixed findings

### 1. Public API rate limit

**Root cause reproduced:** the standard deployment had `minReplicas: 1` and
`maxReplicas: 3`, while the limiter state is SQLite local to a replica. During
a 41-request concurrent probe the deployment had two ready replicas and
returned 41 × `404`, reproducing the verifier's multi-replica bypass.

**Repair:** this SQLite-backed container is now deployed with exactly one
replica (`minReplicas: 1`, `maxReplicas: 1`). The active revision has one ready
replica. README deployment guidance records that reports and rate-limit state
must move to a shared database before any scale-out.

**Regression coverage:**

- `scripts/verify-live-rate-limit.sh` now makes an exact 41-request concurrent
  boundary probe, a 100-request concurrent probe, checks `Retry-After: 1` on
  every rejection, and verifies recovery after an idle second.
- `cargo test claim_backend_rate_limit` continues to exercise two app instances
  that share one SQLite file under 100 concurrent requests.
- Live result: `concurrent 41=40x404/1x429; concurrent
  100=40x404/60x429; idle recovery=404`.

### 2. Dark static 404 contrast

**Root cause reproduced:** the static `404.css` used light-mode `#1559D6` for
links and focus outlines on dark `#222832`, which is 2.42:1.

**Repair:** dark static-404 links and focus outlines now use the documented
dark cobalt `#75A7FF`; the revealed skip link also has a dark, high-contrast
surface.

**Regression coverage:** the local Playwright server now uses the production
Rust static-file path, not Vite's SPA fallback. The added
`static 404 keeps links and focus indicators accessible in dark mode` test
asserts a real 404 status, the dark link and focus colors, and zero serious or
critical axe findings in both desktop and 390 px mobile projects.

## Verification

All commands were run after `npm ci` (0 vulnerabilities).

```text
npm test                                                        PASS (4 unit, 34 browser)
npx tsc --noEmit                                                PASS
VITE_BUILD_SHA=7e265c66… npm run build                         PASS; dist/ produced
cargo fmt -- --check                                            PASS
cargo clippy --all-targets -- -D warnings                       PASS
cargo test                                                      PASS (7/7)
cargo build --release                                           PASS
npm audit --omit=dev                                            PASS (0 vulnerabilities)
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
                                                                  PASS (34/34)
npm run verify:live-rate-limit                                  PASS
```

The live browser suite covers desktop and 390 px mobile, keyboard navigation,
axe scans including the dark static 404, privacy request boundaries, offline
demo reload, and the complete declared claims suite. A direct live service
worker check confirmed `controlled: true`, `state: activated`, and successful
`registration.update()`.

The release binary was also run with an otherwise empty environment (`PATH`
only): it defaulted to port 8080, created its data directory, and returned
`{"status":"ok","build_sha":"dev"}`. Shell and static-404 responses include
CSP with `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy,
disabled camera/microphone/geolocation permissions, and `Cache-Control:
no-cache`.

`verify-url.sh` found no console errors, one `h1`, one `main`, `lang=en`, no
missing image alternatives, and no unlabeled buttons on both landing and demo:
[landing evidence](evidence/repair-4-landing/verify.json) and
[demo evidence](evidence/repair-4-demo/verify.json).

Fresh mobile Lighthouse evidence is
[repair-4-lighthouse.json](evidence/repair-4-lighthouse.json): Performance
100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.080 s, LCP 1.106
s, TBT 2 ms, CLS 0.

The production Docker image was built by ACR from the root multi-stage
Dockerfile and deployed successfully. There is no consumer package for this
private web-with-backend product.

## Known non-blocking follow-up

The verifier's Medium/Low findings were intentionally left outside this
release-blocker repair:

1. The researched paid collaboration path still needs a user-facing team-share
   flow, exact one-time price, Sociobot checkout, return-token handling, and
   license restore UI.
2. `backend-report-validation` should eventually prove the five/six-task and
   exact body-size limits through the licensed public HTTP boundary, rather
   than direct validation/storage calls.
3. The stable-name hero WebP still has immutable one-year caching; give it a
   content-hashed name or a revalidating cache policy when the artwork changes.
