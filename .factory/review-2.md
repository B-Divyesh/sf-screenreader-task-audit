# Adversarial first-read review 2

**Product:** Screenreader Task Audit  
**Live URL:** <https://screenreader-task-audit.sociobot.in>  
**Reviewed:** 29 August 2026 UTC  
**Repository reviewed:** `43a0ba6a947306ed49d84d34d0bad8404d13deba`

## Verdict

**FAIL.** One blocking finding remains. The JSON “backup” cannot restore the screen-reader or browser context collected during setup. This is a partial regression of **F-1-23**.

## 30-second cold first read

Fresh Chromium contexts were checked before scrolling at 390 × 844 and 1440 × 900.

- **What it does:** Records screen-reader task evidence and puts it in a prioritized report.
- **For whom:** Blind founders and small teams fixing a critical dashboard task.
- **What to click first:** **Try it with sample data**.

This gate passes. At 390 px, the first screen shows the exact headline “Record screen-reader task evidence,” the audience sentence “For blind founders and small teams fixing a critical dashboard task.”, the primary action, its result “See five filled tasks and a prioritized report.”, and the three short facts. No scrolling was needed. The live page made only same-origin requests and logged no console errors in either context.

## Findings

### Blocking

#### F-2-1 — JSON restore drops the screen-reader and browser evidence (reopens F-1-23)

- **Quote/location:** README: “Export an accessible HTML report or a JSON backup.” Privacy page: “Import it later to restore an editable audit.” `.factory/claims.json`, `import-json`: “An exported JSON audit can be restored after explicit confirmation.”
- **Evidence:** In a fresh live context, an audit was created with screen reader **NVDA 2026.1** and browser **Firefox 142**, exported as JSON, and imported into a second fresh context. The export contained only `environment: "NVDA 2026.1 · Firefox 142"`. The restored `sra:audit:v1` contained `assistiveTech: ""` and `browser: ""`; its report rendered `Restore product · ·`. In code, `reportData()` combines the two values into `environment`, while `auditFromImport()` sets both restored fields to empty strings. The existing `@claim:import-json` test only checks the audit name after restore, so it cannot catch this loss.
- **Why this fails:** The screen reader and browser are part of the audit setup and are needed to reproduce or compare an observation. Calling this file a backup and the result an editable restored audit is misleading when that context silently disappears.
- **Concrete fix:** Export separate `assistiveTech` and `browser` fields in the JSON schema and restore them. Preserve the original creation timestamp if it is part of the audit record, or label the import as a new copy. Extend `@claim:import-json` to create an audit with every setup field and task field, export it, import in a fresh browser context, reload, and assert exact restoration in the setup form and report.

## Copy audit

Counts treat hyphenated terms, version strings, and URLs as one word. No landing or README sentence exceeds 22 words. No banned marketing adjective, empty slogan, or non-result primary action was found. Headings name their sections in context; the primary button is the required result-naming action.

### Landing-page sentences

| Sentence | Words | Check |
| --- | ---: | --- |
| For blind founders and small teams fixing a critical dashboard task. | 11 | Clear audience and situation |
| See five filled tasks and a prioritized report. | 8 | `five-tasks`; `report-priority` |
| Free audits stay in this browser. | 6 | `privacy-boundaries` |
| The demo works offline after its first visit. | 9 | `offline-reload` |
| Record up to five critical tasks. | 6 | `five-tasks` |
| Focus moves behind the calendar. | 5 | Realistic sample observation |
| Its days have no accessible names. | 6 | Realistic sample observation |
| Revenue cells sound blank because the chart has no text alternative. | 11 | Realistic sample observation |
| The menu and download notice are both announced. | 8 | Realistic sample observation |
| Choose work that affects revenue, support, or daily operations. | 9 | Useful instruction |
| Record announcements, focus movement, the result, and any blocker. | 9 | `structured-capture` |
| Export accessible HTML or JSON ordered by result and impact. | 10 | Export and ordering claims |
| It records manual observations. | 4 | Scope claim |
| It does not scan a product. | 6 | Scope claim |
| It does not watch a tester or record page text. | 10 | Privacy claim |
| It does not collect passwords or analytics data from the product you test. | 13 | Privacy claim |
| It does not certify accessibility or provide legal advice. | 9 | Scope claim |
| Export JSON, then import it later in this browser. | 9 | **F-2-1** |
| Save up to five critical tasks in this browser. | 9 | Local and task-limit claims |
| Download accessible HTML or JSON at no cost. | 8 | Export claims |
| Record task evidence and fix blockers. | 6 | Useful footer one-liner |

### Landing headings, labels, and actions

| Copy unit | Words | Check |
| --- | ---: | --- |
| Screenreader Task Audit | 2 | Wordmark |
| Demo | 1 | Clear navigation label |
| My audit | 2 | Clear navigation label |
| Privacy | 1 | Clear navigation label |
| Task evidence | 2 | Identifies the hero topic |
| Record screen-reader task evidence | 4 | Plain job headline |
| Try it with sample data | 5 | Result-naming primary action |
| Sample report | 2 | Names the preview |
| Prioritized task evidence | 3 | Names the preview content |
| Change the report date range | 5 | Sample task |
| Find the top-selling product | 4 | Sample task |
| Export the orders report | 4 | Sample task |
| How the audit works | 4 | Names the section |
| Name critical tasks | 3 | Clear step |
| Record observations | 2 | Clear step |
| Export the report | 3 | Clear step |
| What this audit does not do | 6 | Names the limits section |
| Local audit | 2 | Names the scope |
| What the free audit includes | 5 | Names the section |
| Keep your work editable | 4 | Describes import/export benefit; see F-2-1 |
| Start an audit | 3 | Result-naming action |
| Save task evidence | 3 | Names the feature |
| Download accessible HTML or JSON | 5 | Names the feature |
| Terms | 1 | Clear footer link |
| Visit Param Factory (external) | 4 | Explicit external destination |

The hero image alternative text, “Five paper task slips show keyboard focus and screen-reader sound waves.”, is 11 words and describes the image’s purpose without adding required text.

### README sentences

| Sentence | Words | Check |
| --- | ---: | --- |
| Record screen-reader task evidence for a critical dashboard task. | 9 | Clear summary |
| Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. | 13 | Clear audience |
| Record observations for up to five critical tasks. | 8 | `five-tasks` |
| Review the tasks in result-and-impact order. | 7 | `report-priority` |
| Export an accessible HTML report or a JSON backup. | 10 | **F-2-1** |
| This tool records manual observations. | 5 | Scope claim |
| It does not scan a product, certify accessibility, or provide legal advice. | 12 | Scope claim |
| Open `?demo=1`, `/demo`, or <https://screenreader-task-audit.sociobot.in/?demo=1>. | 5 | Clear demo entry |
| The demo loads five realistic analytics tasks in one click. | 10 | Demo and limit claims |
| It uses the separate `demo:sra:audit:v1` browser storage key. | 8 | Demo claim |
| Reset demo restores the original sample. | 6 | Demo claim |
| Start for real discards the demo key before opening your audit. | 11 | Demo claim |
| The service worker makes the demo available offline after its first visit. | 12 | Offline claim |
| Setup asks for the tester’s consent before recording. | 8 | Capture claim |
| Five task sheets record expected steps, announcements, focus, blockers, and notes. | 10 | Capture claim |
| Event traces record focus, actions, and announcements when a sequence matters. | 10 | Capture claim |
| Reports sort tasks by result and impact. | 7 | Ordering claim |
| Accessible HTML and JSON exports are free. | 7 | Export claims |
| JSON exports can be imported after you confirm the restore. | 10 | **F-2-1** |
| Free audits stay in browser storage under `sra:audit:v1`. | 7 | Privacy claim |
| The local audit does not send task content to a server. | 10 | Privacy claim |
| The site has no analytics, ads, third-party fonts, or runtime scripts. | 11 | Privacy claim |
| Requirements: Node 22+, npm, current stable Rust, and SQLite build support. | 11 | Developer requirement |
| Vite runs the frontend during development. | 6 | Developer instruction |
| Build the frontend before running the production server: | 8 | Developer instruction |
| The container needs only `PORT`. | 5 | Developer instruction |
| It defaults to `8080`. | 4 | Developer instruction |
| `DATA_DIR` can override the default `data` directory. | 7 | Developer instruction |
| `BUILD_SHA` can label `/health` but is not required. | 8 | Developer instruction |
| `npm test` runs unit and Playwright tests. | 7 | Developer instruction |
| The production frontend lands in `dist/`. | 6 | Developer instruction |
| Open <http://localhost:8080/?demo=1> and check <http://localhost:8080/health>. | 5 | Developer instruction |
| The axum server serves `dist/` and exposes `GET /health`. | 9 | Developer instruction |
| Reserved report API routes validate a report body before storage. | 10 | Backend validation claim |
| They allow no more than five tasks and a 200 KB encoded body. | 13 | Backend validation claim |
| API routes accept a burst of 40 requests from the first `X-Forwarded-For` address. | 13 | Rate-limit claim |
| One idle second resets the allowance. | 6 | Rate-limit claim |
| Limited responses return `429` and `Retry-After: 1`. | 7 | Rate-limit claim |
| After deployment, verify that public boundary with: | 7 | Developer verification instruction |
| The check sends 41 harmless requests for one forwarded address. | 10 | Developer verification instruction |
| Requests 1–40 must return `404`; request 41 must return `429` with `Retry-After: 1`. | 13 | Rate-limit claim |
| Read `/privacy` and `/terms` in the app. | 7 | Clear route instruction |
| Implementation details live in [.factory/design.md](.factory/design.md), [.factory/demo.md](.factory/demo.md), and [.factory/claims.json](.factory/claims.json). | 8 | Clear documentation pointer |
| The factory deploys the root `Dockerfile`. | 6 | Developer instruction |
| It builds the Vite frontend and Rust server in separate stages. | 11 | Developer instruction |
| The runtime listens on `PORT` as a non-root user. | 9 | Developer instruction |
| MIT. | 1 | License identifier |
| See `LICENSE`. | 2 | Clear pointer |

## Demo and sandbox

**Pass.** The visible first-screen action opened a realistic five-task Northstar Metrics audit in one click. The first app screen already contained the populated task rail and active observation sheet. The persistent banner read “Demo — sample data, nothing is saved,” with working **Reset demo** and **Start for real** actions.

In a fresh live browser context, direct `/demo` created and edited only `demo:sra:audit:v1`; `sra:audit:v1` stayed `null`. Reset restored “Change the report date range.” Start for real removed the demo key before opening `/audit`; it then created a separate blank real audit. All observed requests stayed on `https://screenreader-task-audit.sociobot.in`.

## Claims and quality checks

All 14 commands listed in `.factory/claims.json` were run from a fresh local clone. The browser claim suite passed in desktop and 390 px mobile Chromium; `test-results/.last-run.json` reported `{"status":"passed","failedTests":[]}`. The two Rust claim commands were run from that clone as well.

| Claim | Result |
| --- | --- |
| demo-sandbox, core-workflow, structured-capture, five-tasks | Pass |
| report-priority, html-export, json-export, anonymous-export | Pass |
| import-json | Pass, but insufficient for F-2-1 |
| privacy-boundaries, offline-reload, manual-evidence-not-certification | Pass |
| backend-rate-limit, backend-report-validation | Pass |

`npm test`, `npx tsc --noEmit`, `npm run build`, `cargo test`, `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo build --release` were run from the same clean clone. The frontend test suite passed (30 Playwright tests); no command reported a failure before this review was written.

No unlisted live claim was found beyond the incomplete backup/restore promise in F-2-1. The claims registry covers local storage, privacy, demo, task-limit, capture, ordering, export, import, offline, scope, rate-limit, and validation promises.

## History verification

All prior review, polish, and handoff records were read. The following checks were made against the current live build and source rather than relying on their “fixed” labels.

| Earlier finding | Current verification |
| --- | --- |
| F-1-1 | Fixed: current source/documentation enforce the 40-request limiter; declared backend claim passes. |
| F-1-2 | Fixed: no team-sharing purchase or dead checkout appears in visitor copy. |
| F-1-3 | Fixed: `activate()` changes active task with the storage namespace; demo transitions save correctly. |
| F-1-4 | Fixed: live Start for real removes `demo:sra:audit:v1` before `/audit`. |
| F-1-5 | Fixed: no unsupported 30-day paid-link promise remains. |
| F-1-6 | Fixed: loaded shared reports receive the shared-report title in source. |
| F-1-7 | Fixed: `core-workflow` records, reloads, and displays a report. |
| F-1-8 | Fixed: `report-priority` asserts complete screen and JSON order. |
| F-1-9 | Fixed: `privacy-boundaries` records public-route requests and capture calls. |
| F-1-10 | Fixed: `structured-capture` asserts consent and named trace types. |
| F-1-11 | Fixed: payment path and payment-data promises are removed from visitor copy. |
| F-1-12 | Fixed: backend boundaries are separately declared and tested. |
| F-1-13 | Fixed: public routes have route-specific title and metadata. |
| F-1-14 | Fixed: 390 px route tests assert 44 px anchor/button dimensions. |
| F-1-15 | Fixed: manual-only and no-certification scope is declared. |
| F-1-16 | Fixed: sitemap lists all documented public routes. |
| F-1-17 | Fixed: live designed 404 returns 404 with shell, metadata, and plain wording. |
| F-1-18 | Fixed: Param Factory visibly says it is external. |
| F-1-19 | Fixed: current README sentences are at or below 22 words. |
| F-1-20 | Fixed: headings name their sections and decorative visitor provenance copy is absent. |
| F-1-21 | Fixed: copy consistently uses critical task, impact, top-selling product, and report. |
| F-1-22 | Fixed: public copy uses “analytics data” and “asks for consent.” |
| F-1-23 | **Partially fixed; reopened as F-2-1.** Import validates, previews, and confirms, but it drops setup context. |

The handoff’s collaboration follow-up is not advertised as a visitor feature; free export and import provide the brief’s reproducible-report path. An AI feature is not implied: this product records first-hand observations and does not need a decorative model call.

## Structure and routing

**Pass except for F-2-1.** Direct checks returned 200 for `/`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms`; `/missing` correctly returned 404. Each application route had one `<main>`, one `<h1>`, and an appropriate per-route title. The route crawl found no dead visitor link; the 404 page’s local `#main` skip link intentionally resolves on the 404 page itself.

Header/footer links, Privacy, Terms, skip link, focus movement to the new heading, canonical metadata, OG/Twitter metadata, favicon, social art, robots, sitemap, responsive layout, and the risograph evidence-desk identity were checked. The visual system is distinct and follows `.factory/design.md`; it does not resemble a generic centred SaaS template. Back/forward routing and keyboard focus are covered by the browser suite. Security headers include CSP, `frame-ancestors 'none'`, `X-Content-Type-Options`, and the stated referrer policy.

## What would make this perfect

Make exported JSON a true, lossless local audit backup: restore the selected screen reader, browser, and other audit context after explicit confirmation, then prove that complete round trip from a fresh browser context. Rerun this full review after that change. A PASS requires zero findings.
