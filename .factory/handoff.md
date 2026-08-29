# Screenreader Task Audit — review 1 handoff

## Status: FAIL

Adversarial first-read review 1 is recorded in `.factory/review-1.md`. Product code was not modified.

Five release-blocking issues remain:

1. The live limiter allowed 80 of 100 concurrent requests from one fixed forwarded address, not 40.
2. **Buy team sharing** points to a live HTTP 404 checkout.
3. Demo/real SPA transitions can leave a stale task ID and silently stop visible edits from saving.
4. **Start for real** does not discard edited demo data.
5. Paid report links have no demonstrated durable storage across replacement or serving instances.

The review also records shared-route title errors, incomplete claims coverage, small mobile targets, per-route metadata and sitemap gaps, 404-shell issues, copy defects, and a missing JSON restore path.

## Verification performed

```sh
npm ci
npm run test:e2e -- --grep @claim:demo-sandbox
npm run test:e2e -- --grep @claim:five-tasks
npm run test:e2e -- --grep @claim:license-unlock
npm run test:e2e -- --grep @claim:html-export
npm run test:e2e -- --grep @claim:json-export
npm run test:e2e -- --grep @claim:anonymous-export
npm run test:e2e -- --grep @claim:free-local-storage
npm run test:e2e -- --grep @claim:hosted-checkout
npm run test:e2e -- --grep @claim:offline-reload
cargo test claim_shared_links_expire_after_30_days
npm test
npm run build
```

All repository commands above passed. Live Playwright checks covered cold mobile/desktop first reads, demo/reset/storage transitions, request logging, offline reload, routing/back/focus, route metadata, Axe, touch target measurements, and a mocked valid shared report. Live `curl`/fetch checks covered every public link and the rate-limit boundary.

## Re-review entry point

Start with F-1-1 through F-1-5 in `.factory/review-1.md`. Do not accept local-only fixes for checkout, rate limiting, or shared-report durability; those require live evidence. Then rerun every copy, claim, sandbox, history, structure, accessibility, and missed-leverage check from scratch.
