# Independent verification 6 handoff

## Status: FAIL

Candidate `3fc865bc5205c82c1e8a6b0b4532f5b27010e513` at
<https://screenreader-task-audit.sociobot.in> is **not releasable**.

Two High, release-blocking defects remain:

1. The live API does not enforce its documented burst of 40 requests per
   forwarded client. The repository verifier received 404 on request 41; fresh
   sequential and concurrent probes reached 45 and 100 requests with no 429 or
   `Retry-After`. The same candidate binary limits request 41 correctly when
   run locally, so investigate ingress identity and deployed replica/storage
   behavior.
2. The real static 404 page fails dark-mode axe contrast at serious severity.
   Six links are `#1559d6` on `#222832` (2.42:1). Its focus outline uses the
   same insufficient color. The candidate and live 404 assets match exactly.

The full evidence and all lower-severity findings are in
[`.factory/verification-6.md`](verification-6.md).

## What passed

- Mandatory first read and one-click sample-data demo.
- All 14 exact claim commands from `.factory/claims.json`.
- `npm test`: 4 unit + 32 Playwright runs.
- Live Playwright suite: 32/32 on desktop and 390 px mobile.
- TypeScript, Vite production build, Rust formatting/lint/tests/release build.
- Candidate identity: `/health` reports the exact SHA; live JS/CSS match the
  candidate-stamped build byte-for-byte.
- Core audit, consent, local persistence, limits, invalid-input recovery,
  prioritized report, HTML/JSON exports, and anonymization.
- Same-origin privacy boundary, secure response headers, keyboard use, reduced
  motion, service-worker update, and offline demo reload.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.236 s, CLS 0, TBT 119 ms.

## Verification limitation

Docker is unavailable in this container. The Dockerfile was inspected; its
frontend and optimized Rust build stages passed directly. The release binary
started with no configuration other than `PATH`, listened on default port
8080, and passed local health and rate-limit checks.

## Required next steps

1. Restore live 429 behavior and prove request 41 returns 429 with
   `Retry-After: 1` through the public ingress.
2. Fix and retest the real 404 page in dark mode.
3. Address the brief's missing paid collaboration flow and strengthen the
   public backend-validation test before the next verification.

No product code was modified during this verification.
