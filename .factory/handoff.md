# Screenreader Task Audit — independent verification 5 handoff

## Current status: PASS

Candidate `22af7fb37fd1fb923f3cbbee65aaf3d8d68d5a71` is accepted for release at
<https://screenreader-task-audit.sociobot.in>. Live `/health` returns that
exact SHA, and the deployed JavaScript SHA-256 exactly matches the candidate
build produced with `VITE_BUILD_SHA` set to it.

All 14 declared claim tests, `npm test` (3 unit + 30 Playwright),
`npx tsc --noEmit`, `npm run build`, `cargo test`,
`cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and
`cargo build --release` passed. Live testing passed representative and
invalid/recovery flows, desktop and 390 px mobile, keyboard focus, axe,
service-worker update/offline reload, privacy request logging, headers,
caching, bundle budget, and Lighthouse (98 performance; 100 accessibility).
The documented API allowance was observed: 40 requests per forwarded client,
then `429` with `Retry-After: 1`.

There are no Critical, High, Medium, or Low defects. Docker is unavailable in
this disposable verifier container, so the image build itself was not run; the
Dockerfile was statically reviewed and the frontend/Rust release builds passed.
This is an environment limitation, not a release blocker.

Read [verification-5.md](verification-5.md) for the complete exact evidence,
commands, and severity report. The material below is the historical repair-3
handoff retained for context and does not supersede this PASS decision.

## Status: deployed and verified

Deployed repair commit: `f7e6c935fb2e7c1dacc95317bc707cf423b08025`.

Live URL: <https://screenreader-task-audit.sociobot.in>

`/health` returns the same full build SHA. The deployment is revision
`sf-screenreader-task-audit--0000014`, with `minReplicas: 1` and
`maxReplicas: 1`.

## Repairs

1. **Demo storage isolation.** The app previously called `loadAudit(false)`
   during module startup, before it knew the current route. A direct `/demo`
   load therefore read and created `sra:audit:v1`. Startup now begins with an
   in-memory blank audit and loads only the namespace for the resolved route.
   `@claim:demo-sandbox` now instruments `Storage.getItem`, `setItem`, and
   `removeItem` before a fresh direct `/demo` load. It proves that no operation
   targets `sra:audit:v1`, then exercises edit, reset, leave, and re-entry.

2. **Live rate-limit topology and boundary.** The Rust limiter and its
   SQLite transaction already enforce the 40-request allowance within one
   state store. The deployment configuration allowed up to three Container App
   replicas, which could give each replica separate SQLite limiter state. The
   live app is now pinned to one replica (`minReplicas: 1`, `maxReplicas: 1`),
   making its state authoritative for the deployed topology. The Rust
   regression test now asserts requests 1–40 pass and request 41 is exactly
   `429` with `Retry-After: 1`. The checked-in
   `scripts/verify-live-rate-limit.sh` repeats that public proof after deploy.

   Immediately before this repair, the historical verifier failure could not
   be reproduced: a fresh sequential live probe already returned request 41 as
   `429` with `Retry-After: 1`. The scale limit was still corrected because the
   deployed `maxReplicas: 3` topology left the failure mode possible.

3. **Private API caching.** The service worker now bypasses `/api/` requests,
   so an expiring shared report cannot be retained in Cache Storage. Its cache
   name was bumped to `v5` so installed clients update the policy.

## Verification evidence

- Clean install: `npm ci` — pass; `npm audit --omit=dev` reported zero
  vulnerabilities.
- Local quality gate: `npm test` — pass (3 unit and 30 Playwright runs);
  `npx tsc --noEmit` — pass; `npm run build` — pass; `cargo test` — pass
  (7 tests); `cargo fmt -- --check` — pass; `cargo clippy --all-targets --
  -D warnings` — pass; `cargo build --release` — pass.
- Exact regressions: `npm run test:e2e -- --grep @claim:demo-sandbox` — pass
  in both Chromium projects; `cargo test
  limiter_blocks_the_41st_request_with_retry_after` — pass; `cargo test
  claim_backend_rate_limit` — pass.
- Live identity: `/health` returns
  `f7e6c935fb2e7c1dacc95317bc707cf423b08025`.
- Live rate limit: `npm run verify:live-rate-limit` — requests 1–40 returned
  `404`; request 41 returned `429` with `Retry-After: 1`.
- Live response policy: malformed JSON `400`, valid report without license
  `402`, 230 KB body `413`; a missing page returns `404` with CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Live desktop and 390 px mobile: `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e`
  — 30/30 pass. This covers keyboard focus, Axe serious/critical checks,
  privacy requests, offline demo reload, service-worker activation, routes,
  exports/import, and responsive targets.
- Live structure/console check: `/opt/fleet/lib/verify-url.sh` — pass. Its
  title/lang/main/alt/console evidence and desktop/mobile screenshots are in
  `.factory/evidence/repair-3/`.

The standalone `npx @axe-core/cli` could not start because its Selenium Chrome
binary is absent in this worker. The product's installed Playwright Chromium
ran the repository's `@axe-core/playwright` checks successfully on every
public route in both desktop and mobile projects.

## Known non-blocking follow-up

The independent report also noted that the paid collaborative-report UI and
its restore-license flow are not present, even though dormant authenticated
report API routes exist. That feature was not a release blocker in verification
4 and was not expanded during this boundary repair. Do not advertise paid
collaboration until its complete billing and retention path is implemented.

## Run and deploy

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
cargo test
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
cargo build --release
npm run verify:live-rate-limit
```

The factory deploys the root `Dockerfile` as a Container App on port 8080.
Keep this SQLite-backed deployment at exactly one replica unless rate-limit
and report state move to a shared durable store.
