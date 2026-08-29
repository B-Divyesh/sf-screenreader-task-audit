# Independent verification 8 — FAIL

**Candidate:** `f1fb285e290dd4f4f47f6924559917b752311b33`  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Verified:** 2026-08-29  
**Verdict:** **FAIL**

## Decision

The candidate is not releasable. Two mandatory claim commands failed from the clean checkout, the deployed build identity is not the candidate, and core screen-reader/report behavior fails the acceptance contract. The live API rate limit also failed one of five fresh probes, although the other four probes passed.

The free local workflow, privacy boundary, offline demo, production build, and most automated checks are otherwise strong.

## First-read and demo gate

**PASS.** A cold live visit immediately says:

- What it does: “Record screen-reader task evidence.”
- Who it is for: “For blind founders and small teams fixing a critical dashboard task.”
- What to click: “Try it with sample data,” beside “See five filled tasks and a prioritized report.”

The action is visible in the first desktop and 390 px screens. One click opens five realistic tasks with the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**. Only `demo:sra:audit:v1` was present in browser storage.

## Mandatory claim tests

`.factory/claims.json` exists and contains 14 claims. After only `npm ci`, I ran every exact listed command in manifest order from the clean candidate checkout.

| Claim | Initial clean-checkout result |
| --- | --- |
| `demo-sandbox` | **FAIL** — Playwright timed out after 60,000 ms while the Rust web server compiled |
| `core-workflow` | **FAIL** — Playwright timed out after 60,000 ms while compilation continued |
| `structured-capture` | PASS — 2 browser projects |
| `five-tasks` | PASS — 2 browser projects |
| `report-priority` | PASS — 2 browser projects |
| `html-export` | PASS — 2 browser projects |
| `json-export` | PASS — 2 browser projects |
| `anonymous-export` | PASS — 2 browser projects |
| `import-json` | PASS — 2 browser projects |
| `privacy-boundaries` | PASS — 2 browser projects |
| `offline-reload` | PASS — 2 browser projects |
| `manual-evidence-not-certification` | PASS — 2 browser projects |
| `backend-rate-limit` | PASS |
| `backend-report-validation` | PASS |

Both failed browser commands passed when rerun after compilation. This does not erase the clean-run failures: the claims contract says any failing claim command is release-blocking. The Playwright `webServer` uses its 60-second default timeout, which is too short for a fresh Rust dependency download and build in this environment.

The `html-export` claim test also has insufficient coverage. It checks only `<html lang="en">` and one task title, so it passes while the export discards recorded reproduction evidence described below.

## Release-blocking defects

### High — reports discard reproduction evidence

The brief requires captured task observations and an optional event trace to become a prioritized reproducible report. On the local candidate and live demo:

- The on-screen report omits each task’s **Starting place** and entire event trace.
- The accessible HTML export also omits **Other notes**.
- JSON retains these fields, but the human-readable report does not.

The 3,072-byte demo HTML export did not contain any of these known source values:

```text
Overview dashboard
Sighted colleague had to change the range.
Date range button
Pressed Enter.
Focus returned to page navigation.
```

The last three values are the demo’s reproduction trace. A team using the accessible report cannot reproduce the blocker from all the evidence the tester recorded.

### High — keyboard focus is lost during core screen-reader actions

On the local candidate and live demo, keyboard-activating **Add trace event** renders the form but moves focus from the button to `<body>`. There is no live-region announcement. Keyboard-activating another task tab likewise moves focus to `<body>`; the new tab gets `aria-current="true"`, but neither the tab nor the task heading receives focus and no status is announced.

This makes a screen-reader user traverse the page again to discover the result of core actions. The automated keyboard test covers route changes only and does not catch these in-workspace focus failures.

### High — exact deployed candidate identity does not match

`GET /health` and the footer report `e7e4483a51543ad169ed0f802dc93e4fdff065f4`, not candidate `f1fb285e290dd4f4f47f6924559917b752311b33`. The deployment check failed with:

```text
expected build_sha f1fb285e290dd4f4f47f6924559917b752311b33,
got e7e4483a51543ad169ed0f802dc93e4fdff065f4
```

Azure reports single revision `sf-screenreader-task-audit--0000027`, image tag `e7e4483a5154`, and `minReplicas=1`, `maxReplicas=1`.

The mismatch is limited: `e7e4483` is a direct child of the candidate and changes only `.factory` evidence/handoff files. Rebuilding the candidate source with the live SHA produced JS and CSS byte-for-byte identical to live (`7bb725…` JS and `8c2be4…` CSS). Even so, the explicit exact-candidate identity check fails.

### High — public rate-limit enforcement was inconsistent

The required allowance is 40 API requests per first `X-Forwarded-For` address, followed by `429` with `Retry-After: 1`; one idle second resets it.

- Four fresh live runs passed: 41 requests = 40×404/1×429; 100 = 40×404/60×429; idle recovery = 404.
- One fresh repeat failed at the first boundary with **41 ordinary 404 responses** and no rejection at request 41.
- The same script passed against the local candidate.

Because a single client was observed exceeding the documented allowance, the public enforcement is not reliable enough to satisfy the mandatory backend contract, despite the pinned one-replica topology.

### Medium — 200% text resize causes horizontal overflow

At a 390 px viewport, setting the root text size from 16 px to 32 px made `/`, `/demo`, `/demo/report`, and `/privacy` expand from 390 px to **686 px**. The unbroken footer build SHA expands the footer grid. This fails the required 200% text-resize behavior on mobile.

### Medium — researched paid collaboration is not usable

The brief specifies paid collaborative reports and retention. The UI has no share action, exact price, Sociobot checkout link, license return/storage/verification, restore-license field, or user-facing way to create a shared report. Backend report routes and a shared-reader route exist, but a user cannot complete the paid workflow.

## Local build and test evidence

```text
npm ci                                             PASS; 0 vulnerabilities
npm test                                           PASS; 4 unit, 34 browser
cargo test                                         PASS; 8 tests
npx tsc --noEmit                                   PASS
cargo fmt --check                                  PASS
cargo clippy --all-targets --all-features -- -D warnings
                                                    PASS
npm run build                                      PASS; dist/ produced
cargo build --release                              PASS
npm audit --omit=dev                               PASS; 0 vulnerabilities
```

The release binary started with candidate `BUILD_SHA` and returned it from `/health`. It also started with an otherwise empty environment containing only `PATH` and `PORT`; `/health` returned `build_sha: "dev"`. Local 100-request concurrency produced exactly 40 ordinary and 60 limited responses, then recovered after an idle second. HTML revalidated and hashed assets returned one-year immutable caching.

Docker could not be executed because this verifier image has neither `docker` nor `podman`. Static inspection confirms a multi-stage Dockerfile, `rust:1-alpine`, `ARG BUILD_SHA=dev`, a non-root runtime user, and port 8080.

## Live functional, privacy, accessibility, and PWA evidence

- `PLAYWRIGHT_BASE_URL=https://screenreader-task-audit.sociobot.in npm run test:e2e`: PASS, 34/34 across desktop and 390 px.
- Normal and recovery flows passed: consent validation, five-task limit, edit persistence, blocked/partial/completed priority, demo reset/discard, invalid import recovery, JSON/HTML downloads, and anonymized JSON.
- A complete demo edit and both exports made only four same-origin GETs (document, JS, CSS, hero). There were no server writes, third-party requests, console errors, or page errors.
- `/opt/fleet/lib/verify-url.sh` passed landing and `/demo`: HTTP 200, correct title and `lang`, one h1, one main, no missing image alternatives, no unlabeled buttons, no console errors.
- Independent axe runs on live `/demo` found **zero violations of any impact** in light and dark modes at 1440 px and 390 px.
- Without text enlargement, 390 px pages had no horizontal overflow. Interactive buttons/links were at least 44 px, radio labels provide 44 px targets, and focus styling is visible.
- Reduced motion changed the sheet animation from 180 ms to 0.01 ms.
- Service-worker `registration.update()` completed with the worker activated. After an online visit, a 390 px offline reload showed the offline notice and the sample audit.
- Security headers: CSP including `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation disabled. HTML and service worker use `no-cache`; hashed JS and WebP use `public, max-age=31536000, immutable`.
- All discovered internal links and the Param Factory external link returned 200. A missing route returned the designed 404.
- Live mobile Lighthouse: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.2 s, LCP 1.3 s, TBT 110 ms, CLS 0.
- Candidate production assets: JS 32,967 bytes (10,268 gzip), CSS 10,878 bytes (3,434 gzip), hero WebP 148,044 bytes. All are within budget.
- Live unlicensed report creation returned 402; a body over the transport cap returned 413. Internal boundary tests passed five-task and exact 200,000/200,001-byte cases.

## Scope notes

This is a web-with-backend product, not a library or CLI, so consumer packing does not apply. It has no sign-in flow, so the Entra authority check does not apply. No product code was modified during verification.

## Retest requirements

1. Make every claim command start reliably from a cold dependency/build state, then rerun all 14 manifest commands in a fresh clone.
2. Include Starting place, Other notes, and every trace event in the on-screen and HTML reports; strengthen the claim test to compare all captured fields.
3. Preserve or deliberately move focus after task switches and trace-form changes, with an announced state change.
4. Verify every public route at 200% text size on a 390 px viewport without horizontal overflow.
5. Deploy the exact commit under review and require `/health`, the footer, and the container image tag to agree.
6. Repeat the 41/100-request live limiter probe enough times to show the boundary is reliable, not intermittent.
7. Either complete the Sociobot paid collaboration flow or explicitly revise the freemium scope.
