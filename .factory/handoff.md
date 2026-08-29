# Verification 7 handoff — FAIL

Candidate `7fe080f991b7a1ce7fbd24f109f0dc47a1cdf12b` is **not releasable** at <https://screenreader-task-audit.sociobot.in>.

## Release blocker

**High — the deployed API does not enforce its documented rate limit.**

On 2026-08-29, `npm run verify:live-rate-limit` failed on the live URL:

```text
41-request burst: expected 40 ordinary 404 responses, got 41
```

An independent immediately-following 100-request concurrent probe using a new `X-Forwarded-For: 198.51.100.251` produced **100 × 404, 0 × 429**. The live `/health` response was `{"status":"ok","build_sha":"7fe080f991b7a1ce7fbd24f109f0dc47a1cdf12b"}`. This is a deployed-candidate failure, not a stale revision. The promised allowance is 40 requests per forwarded client address with `429` and `Retry-After: 1` starting at request 41; observed live allowance was at least 100 in one concurrent burst, with no limiting response.

Do not release until the deployed topology and/or limiter state make that exact boundary pass on the public URL. Re-run `npm run verify:live-rate-limit` after deployment.

## Other finding

**Medium — no user-facing collaborative paid flow.** The researched brief describes paid collaborative reports and retention. The UI has no team-share entry point, price, Sociobot checkout link, license return/restore handling, or way to create a shared report. Server routes exist but cannot be used end to end from the product. The free local audit is useful; this is not the release blocker above, but it leaves the stated freemium offer incomplete.

## What passed

- The cold live landing page plainly says what it records, who it is for, and puts **Try it with sample data** first; the one-click demo loads five realistic tasks and a prioritized report.
- All 14 `.factory/claims.json` commands passed locally, including both backend claim commands.
- `npm test` passed (4 unit, 34 browser); the full live 34-test Playwright suite also passed. `cargo test` passed (7); `npx tsc --noEmit`, `cargo fmt --check`, `cargo clippy -- -D warnings`, `npm run build`, and `cargo build --release` passed.
- Local direct release-binary startup worked with candidate `BUILD_SHA` and also with only `PATH` and `PORT`; `/health` responded in both cases. Docker could not be invoked because this QA container has no `docker` executable.
- Live privacy, a11y, mobile, and PWA checks passed: same-origin-only request logs; no console/page errors; security headers; service-worker update and offline reload; no serious/critical axe findings at desktop or 390 px; keyboard skip and route-focus checks; no horizontal overflow.
- `/opt/fleet/lib/verify-url.sh` passed live landing and demo. Evidence is committed under `.factory/evidence/verification-7-landing/` and `.factory/evidence/verification-7-demo/`.
- Mobile Lighthouse: Performance 92, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.6 s, CLS 0. Initial JS is 33,004 bytes (10.3 KB gzip), CSS 10.9 KB (3.4 KB gzip), hero WebP 148 KB.

See `.factory/verification-7.md` for commands, claim-by-claim results, and evidence.
