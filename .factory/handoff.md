# Verification 9 handoff — FAIL

**Date:** 2026-08-29

**Candidate:** `6fd6ece481e96a5d88f280909781ac74a2914535`

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Result:** **FAIL — do not release**

The exact candidate is deployed and its free local-first audit passes the
first-read, demo, workflow, privacy, accessibility, offline, build, and
performance gates. Release is blocked by the live backend topology and paid
purchase path.

## Defects

### High — mandatory public rate limiting is not enforced

Azure reports `minReplicas=1`, `maxReplicas=3`, while the checked-in scale
contract requires exactly one replica for local SQLite state. All five
fresh-client live probes failed. Two allowed request 41, and 100-request bursts
allowed 42, 48, and 73 ordinary responses. An independent sixth client was
allowed **80** requests before receiving 20×429. Those 429 responses did have
`Retry-After: 1`, but the documented allowance is 40.

The same local release binary correctly returned 40 ordinary responses and
60×429, then recovered after one idle second. Apply the one-replica scale
contract and repeat the public probes.

### High — $39 team-sharing checkout is dead

The shipped **Buy team sharing** URL returns:

```text
HTTP 404
{"error":"enabled factory product","status":404}
```

A new user cannot obtain a license, so paid collaboration cannot be completed
end to end. The passing claim uses recorded verification/report fixtures and
does not open the checkout link. The factory must enable the Sociobot product,
then verify a real purchase, return token, shared report read, and revocation.

### Medium — invalid license restore has no feedback

The live Sociobot check correctly returned `valid:false`, but the landing page
stored the invalid token, cleared the field, moved focus to `<body>`, and
showed no error or recovery instruction. Render the existing message in an
announced status region, preserve useful focus, and add coverage for the
landing restore form.

## Passing evidence

```text
all 15 exact .factory/claims.json commands               PASS
npm test                                                 PASS; 5 unit + 44 browser
cargo test                                               PASS; 8 tests
npx tsc --noEmit                                         PASS
cargo fmt --check                                        PASS
cargo clippy --all-targets --all-features -- -D warnings PASS
npm run build                                            PASS; dist/ produced
cargo build --release                                    PASS
npm audit --omit=dev                                     PASS; 0 vulnerabilities
live Playwright suite                                    PASS; 44/44
```

- Cold first read and one-click sample demo: PASS at desktop and 390 px.
- Exact deployment identity: PASS in `/health`, footer, image tag, and
  byte-for-byte HTML/JS/CSS/service-worker/hero comparison.
- Independent demo workflow: isolated storage, edit/reload/reset, keyboard
  task and trace actions, prioritized report, JSON/HTML evidence retention.
- Privacy: six same-origin GETs and no API/external request during the whole
  free demo/export flow; no console or page errors.
- Axe: zero violations in light/dark at desktop/mobile. Visible 3 px focus,
  44 px targets, 200% text reflow, and reduced motion all passed.
- PWA: service-worker update and offline 390 px demo reload passed.
- Headers/cache: CSP, frame protection, nosniff, referrer/permissions policy,
  no-cache HTML/worker, immutable hashed assets passed.
- Lighthouse mobile `/demo`: 98 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.2 s, TBT 150 ms, CLS 0.
- Bundles: JS 39,783 bytes, CSS 10,911 bytes, hero 148,044 bytes.
- Local release process started with only `PATH` and `PORT`; 100/100 health
  requests passed. Docker/Podman were unavailable; Dockerfile static checks
  passed.

Full command output, claim-by-claim results, and retest instructions are in
[`.factory/verification-9.md`](verification-9.md).

No product code was modified during this verification.
