# Adversarial first-read review 1

**Product:** Screenreader Task Audit

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Reviewed:** 29 August 2026 UTC

**Repository:** `bdedb4acb3f3bce825acd37797290c51b1c88341`

**Live build:** `a549f8a61209ca1e4b0cb4aa3d924968d6cd2ae6`

## Verdict

**FAIL.** There are 23 findings: five blocking, ten major, and eight minor. All listed claim commands pass locally, but the live checkout is dead, the deployed rate limit does not match the README, demo-to-real transitions can silently lose edits, and the paid-link retention claim still lacks durable storage evidence.

## 30-second cold first read

Checked in fresh Chromium contexts at 390 × 844 and 1440 × 900 before scrolling.

- What it does: records evidence from five screen-reader tasks and turns it into a prioritized report.
- For whom: blind founders and small teams checking an essential dashboard task.
- What to click first: **Try it with sample data**.

This gate passes. The exact first-screen copy is “Prove which screen-reader tasks work,” “For blind founders and small teams who need clear evidence before fixing an essential dashboard task,” and “Try it with sample data.” The adjacent result text says “See five filled tasks and a prioritized report.” All three answers are visible at 390 px without scrolling.

## Findings

### Blocking

#### F-1-1 — The live rate limit has regressed from the prior handoff

- **Quote/location:** README, Backend: “API routes accept a burst of 40 requests from the first X-Forwarded-For address.” The previous `.factory/handoff.md` also says the repaired live service allowed exactly 40 requests.
- **Evidence:** A fresh live burst of 100 concurrent harmless `GET /api/reports/0123456789abcdef0123456789abcdef` requests with `X-Forwarded-For: 198.51.100.242` returned **80 × 404 and 20 × 429**. A 45-request burst from another fixed address returned **45 × 404**. Limited responses did include `Retry-After: 1`.
- **Why this fails:** The live service allows twice the documented burst. The 80-response boundary is also consistent with two independently limited instances, which conflicts with the README’s single-replica requirement and increases concern about instance-local report storage.
- **Concrete fix:** Enforce the allowance in one shared store or deploy exactly one durable instance. Add a live acceptance test that sends at least 100 concurrent requests with one fixed client address and asserts exactly 40 ordinary responses, the rest `429`, `Retry-After: 1`, and recovery after an idle second.

#### F-1-2 — “Buy team sharing” opens a 404

- **Quote/location:** Landing and report pages: “Buy team sharing.” Claim `hosted-checkout`: “Team sharing costs $39 once and uses Sociobot and Dodo for checkout and refunds.”
- **Evidence:** `GET https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout` returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
- **Why this fails:** A visitor cannot buy the advertised paid feature. The listed claim test passes only because it checks the anchor `href`; it never opens the hosted checkout.
- **Concrete fix:** Enable/register this product in the Sociobot billing service or remove the paid offer. Strengthen `@claim:hosted-checkout` to follow the link in a clean context and assert a successful hosted-checkout page or documented redirect, price, and refund disclosure.

#### F-1-3 — Switching between demo and real audits can silently stop saving edits

- **Quote/location:** Demo banner “Start for real”; header “Demo”; `src/main.ts` keeps `activeTaskId` across mode changes and only sets a demo task with `activeTaskId ||= ...`.
- **Evidence:** After creating a real audit, entering Demo through the SPA and editing the visible sample task did not change `demo:sra:audit:v1`. In a fresh page with an existing real audit, opening `/demo`, choosing **Start for real**, and editing the visible real task did not change `sra:audit:v1`; the field showed the edit but storage retained an empty value.
- **Why this fails:** The screen displays an editable task but `saveTaskForm` cannot find it because the active ID belongs to the other namespace. A user can lose evidence without an error.
- **Concrete fix:** Whenever `/demo`, `/audit`, `/demo/report`, or `/report` loads a different audit, set `activeTaskId` to a task in that audit before rendering. Add end-to-end tests for real → Demo and direct Demo → existing real; edit a field, change tasks/routes, reload, and assert the correct namespace retained it.

#### F-1-4 — “Start for real” does not discard edited demo data

- **Quote/location:** `.factory/demo.md`: “Sample data is discarded and never copied.” Demo banner: “Demo — sample data, nothing is saved.”
- **Evidence:** Entering “persists after leaving” in a demo task, choosing **Start for real**, and reopening Demo restored that text. `demo:sra:audit:v1` remained present after leaving.
- **Why this fails:** Real audit data remains untouched, but the documented leave behavior is false and the banner overstates what is saved. This can also expose a previous visitor’s demo edits on a shared browser.
- **Concrete fix:** Make **Start for real** remove `demo:sra:audit:v1` before loading the real audit, or offer an explicit one-time “Keep this as my data” choice. Extend `@claim:demo-sandbox` to verify the leave and re-entry behavior.

#### F-1-5 — The paid 30-day link promise is not durable

- **Quote/location:** Landing: “Links expire after 30 days.” README: “The backend stores that shared copy in SQLite for 30 days.” Previous handoff: a private link “could disappear before its 30-day expiry after a replacement.”
- **Evidence:** The unresolved handoff gap remains in code. The Docker image writes SQLite to `/app/data`, declares no volume, and the repository contains no durable deployment configuration. `claim_shared_links_expire_after_30_days` checks a timestamp and immediate retrieval in one in-memory process; it does not test restart survival. The live 80-request rate-limit boundary further suggests state is not shared across all serving instances.
- **Why this fails:** A visitor is asked to pay for a link described as lasting 30 days, while the implementation can lose it on replacement or route retrieval to another instance.
- **Concrete fix:** Provision durable single-writer storage or a shared database, then test create → process restart/new instance → unauthenticated retrieval and expiry after 30 days. Until that passes, remove the 30-day paid promise and disable checkout.

### Major

#### F-1-6 — A valid shared report has the title “Page not found”

- **Quote/location:** `titleFor()` falls through for `/share/<id>` to “Page not found — Screenreader Task Audit.”
- **Evidence:** With `/api/reports/<id>` fulfilled with a valid report, the page rendered `<h1>Shared August audit</h1>` while `document.title` remained “Page not found — Screenreader Task Audit.”
- **Why this fails:** A screen-reader user or browser-tab user is told a valid paid report is missing.
- **Concrete fix:** Give valid shared reports a route title such as “Shared report — Screenreader Task Audit,” and set “Page not found” only after a failed fetch. Add a valid and missing shared-route title test.

#### F-1-7 — The core recording workflow is an unlisted claim

- **Quote/location:** README: “Record screen-reader task evidence and turn blockers into a reproducible report.” “A tester records the task result, announcements, focus movement, and blockers.” Landing: “Note announcements, focus movement, the result, and any blocker.”
- **Why this fails:** These are the product’s main promises, but `.factory/claims.json` has no entry that creates a real audit, records all fields, reloads, and proves they appear in a report.
- **Concrete fix:** Add one core-workflow claim and a clean-context test covering consent, all observation fields, persistence, report generation, and reload; or narrow the copy to what an existing claim proves.

#### F-1-8 — Prioritization is an unlisted claim

- **Quote/location:** Landing: “See five filled tasks and a prioritized report.” “Export an accessible report, ordered by task result and severity.” README: “The report then orders the evidence by task result and impact.”
- **Why this fails:** The export tests check content and task count, not the promised ordering. The unit test is not tagged as a claim and checks only the first and last outcomes, not the full result-and-impact order.
- **Concrete fix:** Add a `report-priority` claim with a mixed sample and assert the complete expected task order in the on-screen report plus HTML and JSON exports.

#### F-1-9 — The no-capture/no-tracking promises are unlisted claims

- **Quote/location:** Landing: “It does not watch a tester or record page text.” “It does not collect passwords or product analytics payloads.” README: “The product has no analytics, ads, third-party fonts, or runtime scripts.”
- **Why this fails:** `free-local-storage` records requests during one real-audit flow, but its registered claim does not cover camera/screen capture, page-text capture, ads, bundled third-party runtime code, or every public route.
- **Concrete fix:** Add a privacy claim with request logging across landing, demo, real audit, reports, privacy, and terms; assert no capture permissions/APIs are invoked and no unapproved origins or analytics code are present. Remove any part that cannot be tested.

#### F-1-10 — Consent, field, and event-trace capabilities are unlisted claims

- **Quote/location:** README bullets: “A consent-first setup for the product, browser, and screen reader.” “Fields for expected steps, announcements, focus, blockers, and notes.” “An optional local trace for focus, action, and announcement events.”
- **Why this fails:** These are observable capabilities a tester could choose the product for, but no claim entry names or tests them.
- **Concrete fix:** Add a structured-capture claim test that blocks setup without consent, saves every named field, records each trace event type, reloads, and verifies the report output.

#### F-1-11 — Payment-data boundaries are unlisted claims

- **Quote/location:** README: “No payment provider code is embedded here.” Privacy page: “This product does not receive card details.”
- **Why this fails:** The hosted-checkout claim checks visible copy and a URL string only. It does not verify that checkout remains hosted or that card fields, provider scripts, and card data never enter this origin.
- **Concrete fix:** Add a payment-boundary claim that inspects the product bundle and network log, confirms checkout leaves this origin, and confirms no card form/provider script exists here.

#### F-1-12 — Backend enforcement claims are missing or under-tested

- **Quote/location:** README: “Report bodies are capped at 220 KB and five tasks.” “The server verifies the license again before it stores a shared report.”
- **Why this fails:** Neither statement has a `.factory/claims.json` entry. The license-unlock browser test mocks the report endpoint, so it cannot prove server-side verification. The 220 KB statement is also inconsistent with the code’s 200,000-byte encoded-report check and 220,000-byte request-body layer.
- **Concrete fix:** Add separate backend claim tests for the exact accepted/rejected byte boundary, five-task limit, and server-side billing verification before insertion. Use one exact size term in copy and code.

#### F-1-13 — Route metadata does not describe each route

- **Quote/location:** `/demo`, `/audit`, `/report`, `/privacy`, and `/terms` all retain the landing description “Record screen-reader task evidence and turn blockers into a reproducible report” and OG title “Screenreader Task Audit — record task blockers.” `/report` and `/demo/report` also share one title.
- **Why this fails:** Shared links, legal pages, and the demo produce misleading search/share previews and do not meet the per-route metadata contract.
- **Concrete fix:** Update title, description, canonical, OG, and Twitter metadata on every navigation. Use distinct titles such as “Demo report — Screenreader Task Audit.” Add route-by-route assertions.

#### F-1-14 — Mobile navigation and text links miss the 44 px target rule

- **Quote/location:** Live 390 px header/footer and demo/report links.
- **Evidence:** Header links measured 19 px high; footer links 25 px; **Start for real** and **Back to audit** measured 25 px. The wordmark measured 40 px high. Axe reported no serious/critical violations, but it does not enforce this attached 44 px rule.
- **Why this fails:** The product is explicitly reviewed on a phone and targets users who may also have motor or low-vision access needs.
- **Concrete fix:** Add padding/minimum block size so every link and control has at least a 44 × 44 px clickable box without collapsing spacing. Add a 390 px bounding-box test.

#### F-1-15 — The claims registry omits the product’s negative scope promise

- **Quote/location:** README: “It is not an automated scan, an accessibility certification, or legal advice.” Landing: “It does not replace a WCAG review or provide legal advice.” “It does not certify that a product is accessible.”
- **Why this fails:** These limits are important and honest, but they remain claim-like statements outside the claims inventory. A future scanner or score could be added without any contract test catching the contradiction.
- **Concrete fix:** Register a `manual-evidence-not-certification` claim with static UI/code assertions that no scan/score/certification result is presented, or rewrite this as a narrowly testable description of the current workflow.

### Minor

#### F-1-16 — The sitemap does not list every route

- **Quote/location:** `frontend/public/sitemap.xml` lists `/`, `/demo`, `/audit`, and `/privacy` but omits `/terms`, `/report`, and `/demo/report`.
- **Why this fails:** It does not match the required route inventory.
- **Concrete fix:** Add every public static route. If user-specific report routes should not be indexed, document that exception and add appropriate robots metadata instead of silently omitting them.

#### F-1-17 — The 404 page is missing the standard shell and uses a metaphor label

- **Quote/location:** Static and SPA 404: “404 · Missing slip.” The static 404 has no site header/footer, meta description, canonical, OG/Twitter metadata, favicon, or theme color.
- **Why this fails:** “Missing slip” is paper-desk lore rather than a plain route name, and the page breaks the consistent site skeleton.
- **Concrete fix:** Use “404 · Page not found,” include the normal header/footer and required metadata, and keep the existing distinctive paper styling and **Return home** action.

#### F-1-18 — External links do not say they leave the site

- **Quote/location:** “Buy team sharing” and “Built by Param Factory.”
- **Why this fails:** Both go to another origin, but neither visible nor accessible name says “external” or names the hosted destination. Only the footer link has `rel="external"`, which is not an announcement.
- **Concrete fix:** Use names such as “Open Sociobot checkout (external)” and “Visit Param Factory (external),” with an accessible external-link cue.

#### F-1-19 — One README sentence exceeds the 22-word cap

- **Quote/location:** README, Deploy, 28 words: “If the platform is changed to use multiple replicas, mount one durable DATA_DIR that supports SQLite locking or move reports and rate-limit state to a shared database first.”
- **Why this fails:** It combines topology, storage, locking, and migration in one sentence.
- **Concrete rewrite:** “If the platform uses multiple replicas, move reports and rate-limit state to a shared database. Otherwise, mount one durable DATA_DIR with SQLite locking.”

#### F-1-20 — Several headings and labels are vague, subjective, or decorative

- **Quotes/locations and rewrites:**
  - Landing “Evidence, not a score” → “This audit records evidence instead of calculating a score.”
  - Landing “The free audit stays useful” → “What the free audit includes.”
  - Landing “Already bought it?” → “Verify a team-sharing license.”
  - README “What it includes” → “What Screenreader Task Audit includes.”
  - Footer “Original generated collage” → remove from visitor copy; provenance already belongs in `.factory/design.md`.
- **Why this fails:** The current phrases either depend on context, make an untestable value judgment, or do not help the visitor complete a task.

#### F-1-21 — The same concepts use inconsistent words

- **Quote/location:** “essential dashboard tasks” versus “critical tasks”; “impact” versus “severity”; landing “Find the top product” versus demo “Find top-selling product”; README “private team links” versus “private report links.”
- **Why this fails:** A first-time reader must decide whether these are different task classes, ranking concepts, or link types.
- **Concrete fix:** Use **critical task**, **impact**, **top-selling product**, and **private report link** everywhere, including reports and JSON labels.

#### F-1-22 — Two public phrases use avoidable jargon

- **Quote/location:** Landing: “product analytics payloads.” README: “A consent-first setup.”
- **Why this fails:** Neither phrase is likely to be understood on first read by a non-developer.
- **Concrete rewrites:** “It does not collect passwords or analytics data from the product you test.” “Setup asks for the tester’s consent before recording.”

#### F-1-23 — Local-only JSON export has no import or restore path

- **Location:** The free audit is stored only in one browser and can export JSON, but there is no **Import audit** or restore action.
- **Why this matters:** Clearing storage or moving browsers ends the editable audit; the exported JSON cannot resume the work. This is the most obvious missing leverage implied by a local-first audit and its JSON export.
- **Concrete feature:** Add **Import audit JSON** on setup, validate the schema and five-task cap, preview what will be restored, and save only after explicit confirmation. Keep it local and add round-trip and invalid-file tests. An AI feature is not warranted for first-hand observations.

## Copy audit

Counts treat hyphenated terms and numerals as one word. Headings, labels, and fragments are included because they are also heard or scanned as standalone copy.

### Landing page sentence and copy-unit inventory

| Copy | Words | Flag |
| --- | ---: | --- |
| Evidence, not a score | 4 | F-1-20 |
| Prove which screen-reader tasks work | 5 | — |
| For blind founders and small teams who need clear evidence before fixing an essential dashboard task. | 16 | F-1-21 |
| See five filled tasks and a prioritized report. | 8 | F-1-8 |
| Your free audit stays in this browser. | 7 | Listed claim |
| The demo works offline after your first visit. | 8 | Listed claim |
| Free for five critical tasks. | 5 | Listed claim |
| Five paper task slips connect a keyboard path to screen-reader sound waves. | 12 | — |
| Five task slips keep the test small enough to repeat after a fix. | 13 | Unmeasured rationale; remove or state only what the image shows |
| Live report preview | 3 | — |
| Turn observations into a fix list | 6 | F-1-7 |
| Change the report date range | 5 | — |
| Focus moves behind the calendar. | 5 | Sample evidence |
| Its days have no accessible names. | 6 | Sample evidence |
| Find the top product | 4 | F-1-21 |
| Revenue cells sound blank because the chart has no text alternative. | 11 | Sample evidence |
| Export the orders report | 4 | — |
| The menu and download notice are both announced. | 8 | Sample evidence |
| How the audit works | 4 | — |
| Name five tasks | 3 | Listed claim |
| Choose the work that affects revenue, support, or daily operations. | 10 | — |
| Record what happened | 3 | F-1-7 |
| Note announcements, focus movement, the result, and any blocker. | 9 | F-1-7 |
| Share a fix list | 4 | F-1-7 |
| Export an accessible report, ordered by task result and severity. | 10 | F-1-8, F-1-21 |
| What this audit does not do | 6 | — |
| It does not watch a tester or record page text. | 10 | F-1-9 |
| It does not collect passwords or product analytics payloads. | 9 | F-1-9, F-1-22 |
| It does not replace a WCAG review or provide legal advice. | 11 | F-1-15 |
| It does not certify that a product is accessible. | 9 | F-1-15 |
| Team handoff | 2 | — |
| Share reports for a one-time $39 | 6 | F-1-2 |
| $39 once | 2 | F-1-2 |
| Create private report links that a teammate can open without an account. | 12 | Listed claim |
| Links expire after 30 days. | 5 | F-1-5 |
| Sociobot and Dodo handle payment and refunds. | 7 | F-1-2 |
| The free audit stays useful | 5 | F-1-20 |
| Record five tasks. | 3 | Listed claim |
| Save them in this browser. | 5 | Listed claim |
| Export JSON or accessible HTML at no cost. | 8 | Listed export claims |
| Already bought it? | 3 | F-1-20 |
| Record lived task evidence. | 4 | F-1-7 |
| Fix what blocks the work. | 5 | F-1-7 |
| Original generated collage. | 3 | F-1-20 |

Action labels: **Try it with sample data** (5), **Buy team sharing** (3), and **Verify license** (2) all use result-naming verbs. The checkout action still fails functionally under F-1-2.

### README sentence and copy-unit inventory

| Copy | Words | Flag |
| --- | ---: | --- |
| Record screen-reader task evidence and turn blockers into a reproducible report. | 11 | F-1-7 |
| Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. | 13 | — |
| It keeps an audit focused on five essential dashboard tasks. | 10 | F-1-21 |
| A tester records the task result, announcements, focus movement, and blockers. | 11 | F-1-7 |
| The report then orders the evidence by task result and impact. | 11 | F-1-8 |
| This is observed task evidence. | 5 | — |
| It is not an automated scan, an accessibility certification, or legal advice. | 12 | F-1-15 |
| Open /demo or visit https://screenreader-task-audit.sociobot.in/demo. | 5 | — |
| It loads five realistic analytics tasks in one click. | 9 | Listed demo claim |
| The demo uses the separate demo:sra:audit:v1 local storage key. | 9 | Listed demo claim; prefer “browser storage key” |
| Reset demo restores the original sample. | 6 | Listed demo claim |
| Start for real leaves demo mode without copying sample data. | 10 | F-1-3, F-1-4 |
| The service worker makes the demo available offline after its first visit. | 12 | Listed claim |
| A consent-first setup for the product, browser, and screen reader. | 10 | F-1-10, F-1-22 |
| Five structured task sheets with result and impact labels. | 9 | Listed five-task claim |
| Fields for expected steps, announcements, focus, blockers, and notes. | 9 | F-1-10 |
| An optional local trace for focus, action, and announcement events. | 10 | F-1-10 |
| A prioritized report with free accessible HTML and JSON exports. | 10 | F-1-8 |
| An anonymized export option that removes product and environment names. | 10 | Listed claim |
| A $39 one-time license for private team links that expire after 30 days. | 13 | F-1-2, F-1-5, F-1-21 |
| Free audits stay in browser local storage under sra:audit:v1. | 9 | Listed claim; prefer “browser storage” |
| Audit content is sent to the backend only after a licensed user chooses Create private link. | 16 | Listed local-storage claim |
| The backend stores that shared copy in SQLite for 30 days. | 11 | F-1-5 |
| Requirements: Node 22+, npm, current stable Rust, and SQLite build support. | 11 | — |
| Vite runs the frontend during development. | 6 | — |
| To use shared-report endpoints too, run the Rust server after building the frontend. | 13 | — |
| The container needs only PORT; it defaults to 8080. | 9 | — |
| DATA_DIR can override the default data directory. | 7 | — |
| BUILD_SHA can label /health but is not required. | 8 | — |
| npm test runs unit and Playwright tests. | 7 | — |
| Playwright is pinned to 1.58.2. | 5 | — |
| The production frontend lands in dist/ with index.html at its root. | 11 | — |
| Build and run the full container: | 6 | — |
| Then open http://localhost:8080/demo and check http://localhost:8080/health. | 6 | — |
| The axum server serves dist/, stores explicitly shared reports in SQLite, and exposes: | 13 | — |
| GET /health | 2 | — |
| POST /api/reports | 2 | — |
| GET /api/reports/:id | 2 | — |
| API routes accept a burst of 40 requests from the first X-Forwarded-For address. | 13 | F-1-1 |
| One idle second resets the allowance. | 6 | F-1-1 |
| Continuous bursts cannot refill it while requests are still arriving. | 10 | F-1-1 |
| Limited responses return 429 and Retry-After: 1. | 7 | F-1-1 |
| The atomic allowance is stored beside reports in SQLite, so independent app instances using the same database cannot multiply it. | 20 | F-1-1 |
| Report bodies are capped at 220 KB and five tasks. | 10 | F-1-12 |
| The server verifies the license again before it stores a shared report. | 12 | F-1-12 |
| The product has no analytics, ads, third-party fonts, or runtime scripts. | 11 | F-1-9 |
| Free audits and the demo stay local. | 7 | Listed local/demo claims |
| License purchase and verification use the Sociobot billing API; Sociobot and Dodo handle payment and refunds. | 16 | F-1-2 |
| No payment provider code is embedded here. | 7 | F-1-11 |
| Read /privacy and /terms in the app. | 7 | — |
| Implementation details live in .factory/design.md, .factory/demo.md, and .factory/claims.json. | 8 | — |
| The factory deploys the root Dockerfile. | 6 | — |
| It builds the Vite frontend and Rust server in separate stages, then runs the server as a non-root user on PORT. | 21 | — |
| Keep this SQLite deployment at one replica. | 7 | F-1-1, F-1-5 |
| If the platform is changed to use multiple replicas, mount one durable DATA_DIR that supports SQLite locking or move reports and rate-limit state to a shared database first. | 28 | F-1-19 |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

README headings are clear except **What it includes** (F-1-20). **Try the demo**, **Develop**, **Test and build**, **Backend**, **Privacy and payment**, **Deploy**, and **License** identify their sections.

## Demo and sandbox results

| Check | Result |
| --- | --- |
| One click from first screen | Pass |
| First demo screen shows realistic use | Pass: Northstar Metrics, NVDA 2026.1, Firefox 142, and five named tasks are visible |
| Persistent demo banner | Pass |
| Reset demo | Pass |
| Demo edit writes only `demo:sra:audit:v1` | Pass from a cold direct demo |
| Existing `sra:audit:v1` remains unchanged in demo | Pass |
| Start for real discards demo edits | **Fail: F-1-4** |
| Mode transitions continue saving visible fields | **Fail: F-1-3** |
| Demo network stays same-origin | Pass |
| Demo reloads offline after first visit | Pass |

The live request log for load, edit, report navigation, service-worker update, online reload, and offline reload contained only `https://screenreader-task-audit.sociobot.in` and no `/api/` request.

## Claims test results

Every exact command from `.factory/claims.json` was run after `npm ci` in this clean checkout.

| Claim | Command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | Pass, 2/2 |
| `five-tasks` | `npm run test:e2e -- --grep @claim:five-tasks` | Pass, 2/2 |
| `license-unlock` | `npm run test:e2e -- --grep @claim:license-unlock` | Pass, 2/2 |
| `html-export` | `npm run test:e2e -- --grep @claim:html-export` | Pass, 2/2 |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | Pass, 2/2 |
| `anonymous-export` | `npm run test:e2e -- --grep @claim:anonymous-export` | Pass, 2/2 |
| `free-local-storage` | `npm run test:e2e -- --grep @claim:free-local-storage` | Pass, 2/2 |
| `hosted-checkout` | `npm run test:e2e -- --grep @claim:hosted-checkout` | Pass, 2/2, but false-positive; see F-1-2 |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass, 2/2 |
| `shared-expiry` | `cargo test claim_shared_links_expire_after_30_days` | Pass, 1/1, but no restart/durability proof; see F-1-5 |

No listed command failed. The review still fails because a listed live claim is false, two tests do not cover their full promises, and the unlisted claims in F-1-7 through F-1-12 and F-1-15 remain untested.

## History verification

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. The previous handoff and all three verification reports were read.

- Earlier SPA deep-link defect: fixed. `/`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms` return 200; an unknown path returns a designed 404.
- Earlier immutable-cache defect: fixed. Fingerprinted assets use long immutable caching; HTML and the service worker revalidate.
- Earlier incomplete claim coverage: partially fixed. JSON, anonymization, checkout copy, local storage, and no-account link tests now exist, but F-1-2 and F-1-7 through F-1-12/F-1-15 show remaining gaps.
- Earlier live rate-limit defect: **regressed**, F-1-1.
- Handoff durability gap: **still unresolved**, F-1-5.

## Structure, accessibility, and quality checks

- `npm test`: pass, 3 unit tests and 22 Playwright runs.
- `npm run build`: pass; `dist/` produced. Initial JS is 31.58 KB raw / 10.10 KB gzip.
- Live Axe on `/`, `/demo`, `/demo/report`, `/privacy`, and `/terms`, mobile and desktop: zero serious or critical violations.
- Live pages checked have one `<main>`, one `<h1>`, `lang="en"`, visible focus, and no console/page errors.
- Keyboard skip link, forward navigation, browser Back, focus-to-new-`h1`, and scroll reset pass.
- Reduced-motion CSS is present. Mobile pages have no observed horizontal overflow.
- Root metadata, 1200 × 630 original social image, SVG favicon, and 180 × 180 touch icon pass. Per-route metadata fails under F-1-6 and F-1-13.
- Internal route and asset links return 200. Sociobot home returns 200. Checkout fails under F-1-2.
- The risograph evidence-desk identity is distinct and follows `.factory/design.md`; it is not a generic centered SaaS template.
- The landing information order matches the standard skeleton.

## What would make this perfect

Resolve all 23 findings, then rerun this review from a new browser profile and clean checkout. Acceptance requires a working live checkout, one shared live rate-limit boundary, durable cross-restart paid reports, lossless demo/real transitions, zero unlisted claims, route-correct metadata, 44 px mobile targets, plain and consistent copy, and a tested JSON restore path. At that point there should be no remaining severity section at all.
