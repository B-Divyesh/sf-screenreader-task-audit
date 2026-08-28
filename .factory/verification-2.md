# Independent verification 2 — FAIL

**Candidate:** `e74605ff3597045cb66fa39e5daf231336bdd831`  
**Live URL:** https://screenreader-task-audit.sociobot.in  
**Verified:** 2026-08-28 UTC

## Verdict

**FAIL — do not release.** The required live API rate-limit acceptance check did not enforce the documented allowance. This is release-blocking for this backend product even though the local test and all claim tests pass.

`GET /health` on the live URL returned `200` with:

```json
{"status":"ok","build_sha":"e74605ff3597045cb66fa39e5daf231336bdd831"}
```

So the checked deployment identifies itself as the candidate, rather than a stale release.

## Required first-read and demo gate

**Pass.** On a cold live desktop page, the first screen says “Prove which screen-reader tasks work,” identifies “blind founders and small teams,” and offers the one-click **Try it with sample data** action with the result stated: “See five filled tasks and a prioritized report.” The 390 px screen preserves that content and has no horizontal overflow (390 px viewport / 390 px document width).

## Claim-test gate (performed first after `npm ci`)

All ten exact commands from `.factory/claims.json` passed from the clean candidate:

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | Pass (2/2) |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | Pass (2/2) |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock` | Pass (2/2) |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | Pass (2/2) |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | Pass (2/2) |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | Pass (2/2) |
| `free-local-storage` | `npm run test:e2e -- --grep @claim:free-local-storage` | Pass (2/2) |
| `hosted-checkout` | `npm run test:e2e -- --grep @claim:hosted-checkout` | Pass (2/2) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass (2/2) |
| `shared-expiry` | `cargo test claim_shared_links_expire_after_30_days` | Pass (1/1) |

## Local quality checks

- `npm run build`: passed; emitted `dist/`. Initial JS is **10.10 KB gzip** and CSS **3.38 KB gzip**.
- `npm test`: passed: 3 Vitest tests and 22 Playwright runs (`test-results/.last-run.json` reports `passed`).
- `cargo test`: passed: 6 tests.
- `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `npx tsc --noEmit`: passed.
- The local backend test proves its in-process 40 request/second limiter and `Retry-After: 1`; this did **not** reproduce on the actual deployment.

## Live product checks

- Document routes `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, and `/sitemap.xml` returned 200; an unknown path returned 404. The live asset cache policy is `public, max-age=31536000, immutable`; HTML and `service-worker.js` are `no-cache`.
- Cold-load request capture, demo editing, and offline reload contacted only `https://screenreader-task-audit.sociobot.in`; no analytics, CDN font, or other third-party request was observed. Demo edits used the `demo:sra:audit:v1` key and did not create `sra:audit:v1`; **Reset demo** restored the sample task.
- After service-worker activation/update, `/demo` reloaded offline and showed both the offline notice and “August analytics check.”
- Live Axe (Playwright integration) found **zero serious or critical violations** on `/demo`; the repository suite also passed its landing/demo/report/legal axe checks in light and dark treatments. No console or page errors were observed in the fresh live cold-load and offline checks.
- Keyboard smoke passed: first Tab reached the visible skip link and Enter moved focus to `main`; SPA route tests cover focus on the new `h1`. The 3 px cobalt focus outline and reduced-motion stylesheet are present.
- Valid normal flow passed: create a consented local audit, edit task evidence, reach the report, and retain saved local data. Empty setup blocked submission and gave the recovery text “Fill every field and confirm the tester’s consent.”
- Live response headers include CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

## Defects

### High — release blocking

1. **Live API rate limiting is not enforced.** README documents an allowance of 40 requests per second per first `X-Forwarded-For` address and promises `429` plus `Retry-After: 1`. Fresh checks to the candidate used a single fixed forwarded address and a harmless missing report ID:

   - 50 sequential `GET /api/reports/not-a-valid-id` requests with `X-Forwarded-For: 198.51.100.81` returned **50 × 404**, never 429.
   - 100 concurrent requests with `X-Forwarded-For: 198.51.100.82` returned **100 × 404**.
   - 400 concurrent requests with `X-Forwarded-For: 198.51.100.83` returned **400 × 404**.

   No response included `Retry-After`, because no response was rate-limited. This directly fails the backend-service mandatory verification. The source uses an in-memory `DashMap`; local unit coverage passes, but the live result shows that the deployed topology/request path does not enforce the documented per-client boundary. Repair the deployed limiter so it is effective across the live request path/replicas, then repeat the same single-client burst and record the observed allowance and `429`/`Retry-After` evidence.

## Not a release finding, but a persistence boundary to keep explicit

Shared reports are stored in SQLite at `/app/data/reports.db` by the container. The repository does not include deployment storage configuration, so durable retention across a container replacement or multiple replicas could not be independently established from this clone. The product must keep its 30-day private-link claim backed by a durable single-writer volume or shared database before enabling multiple replicas.

## Repair acceptance

The next candidate must show, on the live candidate URL, a repeatable single-client burst exceeding the documented allowance that returns `429` and `Retry-After: 1`, while ordinary requests still work. It must rerun every listed claim test and retain the passing live privacy, offline, route, accessibility, keyboard, mobile, build-identity, caching, and header checks above.
