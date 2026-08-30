# Adversarial first-read review 4

**Product:** Screenreader Task Audit  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Reviewed:** 30 August 2026 UTC  
**Repository base:** `5ef5bf6cf2f516c1ccbf9bef3a1234c309fb18a0`  
**Live build:** `aac4bdc8ebb22aafe7978d18ecf226bf62542162`

## Verdict

**PASS.** There are zero findings. The live product is clear on a cold phone
visit, the sample workflow is isolated and usable in one click, all 21
declared claims pass from an isolated clone, and every prior finding is
verified fixed in both the current source and the live product.

## 30-second cold read

I opened the live home page in fresh Chromium contexts at 390 × 844 and
1440 × 900, before scrolling. Both contexts returned 200 and no console or
page errors.

| Question | Answer visible on the first screen |
| --- | --- |
| What does it do? | It records screen-reader task evidence and produces a prioritized report. |
| For whom? | “For blind founders and small teams fixing a critical dashboard task.” |
| What should I click first? | “Try it with sample data.” The adjacent result says, “See five filled tasks and a prioritized report.” |

The first screen therefore passes the cold-read gate. At 390 px the primary
action was a 358 × 49 px target, visible without scrolling. The visual system
is distinct rather than generic: the live page uses the documented offset-paper
and risograph evidence-desk composition, the original collage, registration
marks, serif display type, and cobalt/vermilion ink palette.

## Copy audit

Counts treat hyphenated terms, URLs, storage keys, and numerals as one word.
Every landing and README sentence is at or below 22 words. I found no banned
marketing adjective, unexplained jargon, inconsistent core terminology, vague
or mood-only heading, or non-result-naming landing action. No copy finding is
open.

### Landing-page sentences

| Words | Sentence |
| ---: | --- |
| 4 | Record screen-reader task evidence |
| 11 | For blind founders and small teams fixing a critical dashboard task. |
| 8 | See five filled tasks and a prioritized report. |
| 6 | Free audits stay in this browser. |
| 9 | The demo works offline after its first visit. |
| 6 | Record up to five critical tasks. |
| 5 | Focus moves behind the calendar. |
| 6 | Its days have no accessible names. |
| 11 | Revenue cells sound blank because the chart has no text alternative. |
| 9 | The menu and download notice are both announced. |
| 9 | Choose work that affects revenue, support, or daily operations. |
| 9 | Record announcements, focus movement, the result, and any blocker. |
| 10 | Export accessible HTML or JSON ordered by result and impact. |
| 5 | It records manual observations. |
| 6 | It does not scan a product. |
| 10 | It does not watch a tester or record page text. |
| 13 | It does not collect passwords or analytics data from the product you test. |
| 9 | It does not certify accessibility or provide legal advice. |
| 8 | Export JSON, then restore the same editable audit. |
| 9 | Save up to five critical tasks in this browser. |
| 6 | Download accessible HTML or JSON. |
| 7 | Create a private link for a teammate. |
| 6 | They do not need an account. |
| 7 | Sociobot and Dodo handle checkout and refunds. |
| 6 | HTML and JSON exports stay free. |
| 6 | This team-sharing license is not active. |
| 7 | Check the token or choose Buy team sharing. |
| 4 | Free exports still work. |
| 3 | Team-sharing license verified. |
| 6 | You can create a private link. |
| 7 | The team-sharing license could not be verified. |
| 3 | Try again shortly. |
| 9 | Record task evidence and review a prioritized report. |

Landing headings identify their sections: “Prioritized task evidence,” “How the
audit works,” “What this audit does not do,” “What the free audit includes,”
and “Share a report with your team.” The actions name their result: “Try it
with sample data,” “Start an audit,” “Buy team sharing,” and “Verify license.”

### README sentences

| Words | Sentence |
| ---: | --- |
| 9 | Record screen-reader task evidence for a critical dashboard task. |
| 13 | Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. |
| 8 | Record observations for up to five critical tasks. |
| 6 | Review the tasks in result-and-impact order. |
| 9 | Export an accessible HTML report or a JSON backup. |
| 5 | This tool records manual observations. |
| 12 | It does not scan a product, certify accessibility, or provide legal advice. |
| 5 | Open `?demo=1`, `/demo`, or <https://screenreader-task-audit.sociobot.in/?demo=1>. |
| 10 | The demo loads five realistic analytics tasks in one click. |
| 8 | It uses the separate `demo:sra:audit:v1` browser storage key. |
| 5 | **Reset demo** restores the original sample. |
| 11 | **Start for real** discards the demo key before opening your audit. |
| 12 | The service worker makes the demo available offline after its first visit. |
| 9 | Setup asks for the tester’s consent before recording. |
| 14 | Five task sheets record the starting place, expected steps, announcements, focus, blockers, and notes. |
| 11 | Event traces record focus, actions, and announcements when a sequence matters. |
| 7 | Reports sort tasks by result and impact. |
| 7 | Accessible HTML and JSON exports are free. |
| 12 | JSON exports restore the setup, tasks, and event traces after you confirm. |
| 5 | Team sharing costs $39 once. |
| 15 | It creates a private report link for a teammate who does not need an account. |
| 9 | Checkout, refunds, and license verification use Sociobot and Dodo. |
| 6 | A refund revokes the team-sharing license. |
| 6 | The product never handles card details. |
| 8 | Choose **Buy team sharing** on the landing page. |
| 16 | After checkout, the return token is stored only in this browser and removed from the URL. |
| 3 | **Have a license?** |
| 8 | **Paste it** restores a purchase on another device. |
| 18 | The report sends its content to the server only after a verified license holder chooses **Create private link**. |
| 8 | Free audits stay in browser storage under `sra:audit:v1`. |
| 11 | The local audit does not send task content to a server. |
| 11 | The site has no analytics, ads, third-party fonts, or runtime scripts. |
| 11 | Requirements: Node 22+, npm, current stable Rust, and SQLite build support. |
| 6 | Vite runs the frontend during development. |
| 8 | Build the frontend before running the production server. |
| 5 | The container needs only `PORT`. |
| 4 | It defaults to `8080`. |
| 7 | `DATA_DIR` can override the default `data` directory. |
| 8 | `BUILD_SHA` can label `/health` but is not required. |
| 7 | `npm test` runs unit and Playwright tests. |
| 6 | The production frontend lands in `dist/`. |
| 6 | Open <http://localhost:8080/?demo=1> and check <http://localhost:8080/health>. |
| 9 | The axum server serves `dist/` and exposes `GET /health`. |
| 12 | A verified team-sharing license is required to create a private report link. |
| 9 | Report API routes validate a report body before storage. |
| 13 | They allow no more than five tasks and a 200 KB encoded body. |
| 13 | API routes accept a burst of 40 requests from the first `X-Forwarded-For` address. |
| 6 | One idle second resets the allowance. |
| 7 | Limited responses return `429` and `Retry-After: 1`. |
| 20 | SQLite uses one local connection with a rollback journal, because Azure File does not support SQLite’s live locking safely. |
| 16 | Private reports are restored from and copied to the mounted durable Azure File volume at `/app/data`. |
| 14 | The versioned container deployment contract requires that durable mount and exactly one ready replica. |
| 7 | After deployment, verify that public boundary with the listed commands. |
| 12 | The check sends concurrent harmless bursts for one forwarded address. |
| 14 | The 41-request burst must return 40 `404` responses and one `429` with `Retry-After: 1`. |
| 18 | A 100-request burst must return 40 `404` responses and 60 `429` responses, then recover after one idle second. |
| 21 | The checkout check verifies the public USD 39.00 catalog entry and that an unpaid request redirects to a hosted Dodo session. |
| 6 | It does not submit payment details. |
| 7 | Read `/privacy` and `/terms` in the app. |
| 8 | Implementation details live in `.factory/design.md`, `.factory/demo.md`, and `.factory/claims.json`. |
| 6 | The factory deploys the root `Dockerfile`. |
| 11 | It builds the Vite frontend and Rust server in separate stages. |
| 9 | The runtime listens on `PORT` as a non-root user. |
| 4 | Apply `.factory/container-scale.json` during deployment. |
| 4 | Mount `screenreader-task-audit-data` at `/app/data`. |
| 13 | Keep one ready replica unless reports and rate-limit state use a shared database. |
| 1 | MIT. |
| 2 | See `LICENSE`. |

The terminology remains consistent: **audit**, **task**, **observation**,
**blocker**, **report**, **event trace**, **screen reader**, **private link**,
and **team-sharing license**.

## Demo and sandbox

**Pass.** Clicking **Try it with sample data** took one click to `?demo=1`.
The first post-click screen already showed the realistic Northstar Metrics
audit: NVDA 2026.1, Firefox 142, five named tasks, an active observation sheet,
results, impact controls, and a three-event trace.

The persistent banner read “Demo — sample data, nothing is saved.” It exposed
working **Reset demo** and **Start for real** controls. In a fresh live 390 px
context, a changed demo task was written only to `demo:sra:audit:v1`; reset
restored “Change the report date range”; leaving removed the demo key and
opened a new real-audit setup. The real audit key was not touched while demo
mode was active. The declared sandbox test independently instruments storage,
checks the namespace, edits, resets, leaves, and re-enters.

## Claims and quality gates

I cloned the repository to an isolated temporary directory, installed the
locked dependencies, and ran every exact command in `.factory/claims.json`.
All passed. Browser claim commands ran in both desktop Chromium and the 390 px
mobile project.

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `core-workflow`, `structured-capture`, `five-tasks` | PASS |
| `team-sharing`, `payment-boundary`, `license-restore-feedback` | PASS |
| `report-priority`, `html-export`, `json-export`, `anonymous-export`, `import-json` | PASS |
| `privacy-boundaries`, `offline-reload`, `saved-audit-offline`, `free-audit-features` | PASS |
| `license-revocation`, `manual-evidence-not-certification` | PASS |
| `backend-rate-limit`, `backend-report-validation`, `private-report-durability` | PASS |

`npm test` passed: 10 Vitest tests and 58 Playwright tests. `npm run build`
passed and produced `dist/` with 40.13 kB JavaScript and 10.91 kB CSS before
gzip. `npm run test:backend` passed all 13 Rust tests.

The privacy claim records all public-route requests and confirms no external
or API request while recording a local audit, as well as no capture-API call.
My fresh live demo visit likewise made only same-origin requests. No live
claim-like sentence on the landing page or in README lacks a matching registry
entry; instructional, legal, sample, and deployment sentences are not product
capability claims.

## History verification

Each item in `.factory/review-1.md`, `.factory/review-2.md`, and
`.factory/review-3.md` was rechecked rather than accepted from its closure
note.

| Earlier finding | Current verification |
| --- | --- |
| F-1-1 | Fixed. Live verifier returned 40 × 404 then 1 × 429 for 41 requests, 40 × 404 then 60 × 429 for 100, then a 404 after idle recovery. |
| F-1-2 | Fixed. The live catalog reports USD 39.00 and checkout returns 303 to a hosted Dodo session. |
| F-1-3 | Fixed. Namespace-aware demo and real-audit edits are covered by `demo-sandbox`; the fresh live flow also behaved correctly. |
| F-1-4 | Fixed. **Start for real** removed `demo:sra:audit:v1` before the real setup loaded. |
| F-1-5 | Fixed. The durability claim creates through the Axum route, restores a durable SQLite snapshot, retrieves the link, and verifies expiry; the live deployment verifier confirmed one ready replica and its durable mount. |
| F-1-6 | Fixed. Route checks confirmed separate loaded/missing shared-report metadata paths in source and the complete live metadata skeleton. |
| F-1-7 | Fixed. `core-workflow` records all fields, reloads, and renders the report. |
| F-1-8 | Fixed. `report-priority` checks the same ordering on screen and in JSON. |
| F-1-9 | Fixed. `privacy-boundaries` records local content while asserting no analytics, capture, external, or audit API request. |
| F-1-10 | Fixed. `structured-capture` checks consent and stored focus, action, and announcement traces. |
| F-1-11 | Fixed. `payment-boundary` checks no card inputs, payment iframe, provider runtime, or first-party card collection and verifies the Sociobot/Dodo handoff. |
| F-1-12 | Fixed. `team-sharing` rejects missing and invalid licenses, uses the real local Axum/SQLite route with the recorded verifier, and opens the stored link in a license-free browser context. |
| F-1-13 | Fixed. All checked routes have one h1/main, title, description, canonical, OG/Twitter data, favicon, and route-specific metadata. |
| F-1-14 | Fixed. The mobile suite asserts 44 px targets and no 390 px overflow; the first-screen action measured 358 × 49 px. |
| F-1-15 | Fixed. The manual-observation/no-scan/no-certification wording is present and has its own claim. |
| F-1-16 | Fixed. Live `sitemap.xml` lists `/`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms`. |
| F-1-17 | Fixed. Live `/missing` returns 404 with the same header/footer, a back-home action, and correct 404 title/description. |
| F-1-18 | Fixed. The footer visibly says “Built by Param Factory (external).” |
| F-1-19 | Fixed. The previously long deployment instruction is now three sentences of 4, 4, and 13 words. |
| F-1-20 | Fixed. Current landing and README headings name their content; no brand lore or generic SaaS hero replaced the product-specific identity. |
| F-1-21 | Fixed. Current copy uses critical task, impact, top-selling product, and report consistently. |
| F-1-22 | Fixed. Current visitor copy uses plain “analytics data” and “asks for consent.” |
| F-1-23 | Fixed. `import-json` validates, previews, requires confirmation, reloads, and compares every editable task field and trace. |
| F-2-1 | Fixed. JSON export/import preserves screen reader, browser, and original creation time; the claim asserts all three. |
| F-3-1 | Fixed. All live footers use the required Built by Param Factory wording with an external-site cue. |

## Structure, routing, and links

**Pass.** Direct loads of `/`, `/demo`, `/audit`, `/report`, `/demo/report`,
`/privacy`, and `/terms` returned 200. `/missing` returned a designed 404 with
a return-home link. The header, skip link, footer, Privacy, and Terms links
are consistent. The history-aware router focuses the new h1 after navigation;
the keyboard test covers skip-link and route focus. `robots.txt`, sitemap,
canonical URLs, Open Graph/Twitter metadata, SVG favicon, apple touch icon,
theme color, security headers, and SPA fallback are present. The live header
sent a CSP with `frame-ancestors` as a response directive, not a meta tag.

I crawled every unique visitor link exposed by the public routes. Same-origin
links returned 200, the checkout link returned the expected 303, and the
external Param Factory link returned 200. No dead link was found.

## Missed leverage

**None found.** The brief calls for manual screen-reader task evidence and a
reproducible report. The product already supplies the expected high-value
workflow: structured task and trace capture, result/impact ordering, HTML and
JSON export/import, offline local operation, and optional account-free private
sharing. AI would not improve this evidence-recording job enough to justify
collecting user content or adding a decorative feature.

## What would make this perfect

Keep the current sample audit realistic as browser and screen-reader versions
change, and continue running the exact claims plus the live rate-limit,
checkout, and deployment verifiers for each release. No product change is
needed from this review.
