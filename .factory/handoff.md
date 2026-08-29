# Verification 8 handoff — FAIL

Candidate `f1fb285e290dd4f4f47f6924559917b752311b33` is **not releasable** at <https://screenreader-task-audit.sociobot.in>.

## Release blockers

1. Two exact `.factory/claims.json` commands failed from the clean checkout because Playwright’s 60-second web-server timeout expired during the fresh Rust build. They passed only after the build cache was warm.
2. The report is not fully reproducible: on-screen output omits Starting place and all trace events; accessible HTML additionally omits Other notes.
3. Keyboard activation of task tabs and **Add trace event** leaves focus on `<body>` without an announcement.
4. Live build identity is `e7e4483a51543ad169ed0f802dc93e4fdff065f4`, not the requested candidate. It is a docs-only child and its JS/CSS are byte-identical to candidate source built with that stamp, but the exact identity contract fails.
5. One of five fresh live rate-limit probes allowed all 41 concurrent requests. The other four produced the expected 40×404/1×429 boundary, so enforcement is intermittent rather than absent.

## Other defects

- At 200% text size and 390 px width, tested routes expand to 686 px because the footer SHA does not wrap.
- Paid collaboration from the researched brief is not exposed end to end: no price, checkout, license restore, or create-share UI.

## What passed

- Cold first-read and one-click sample demo.
- Warm full local suite: 4 unit and 34 desktop/mobile browser tests; 8 backend tests.
- TypeScript, Rust formatting, strict Clippy, frontend production build, Rust release build, and npm audit.
- Full live 34-test suite, same-origin privacy log, security/cache headers, offline reload and service-worker update.
- Zero axe violations in light/dark at desktop and 390 px; no console/page errors; no normal-scale mobile overflow.
- Mobile Lighthouse: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s, TBT 110 ms, CLS 0.
- Local candidate rate limit: 40-request allowance, then 429 with `Retry-After: 1`, and idle recovery.
- Direct release-binary startup with only `PORT` and `PATH`.

Docker was not runnable because this QA image has no Docker-compatible executable. No product code was changed.

## Re-run

```sh
npm ci
npm test
npm run test:backend
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo build --release
PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e
EXPECTED_BUILD_SHA=f1fb285e290dd4f4f47f6924559917b752311b33 npm run verify:live-deployment
npm run verify:live-rate-limit
```

See `.factory/verification-8.md` for claim-by-claim results, exact evidence, and retest guidance.
