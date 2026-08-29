# Adversarial first-read review 3

**Product:** Screenreader Task Audit

**Live URL:** <https://screenreader-task-audit.sociobot.in>

**Reviewed:** 29 August 2026 UTC

**Repository:** `db4221233ab4e7155d86b836176c1498588d19f1`

**Live build:** `7e14629264bec2f84a18b93ec9924dfbb5437382`

## Verdict

**FAIL.** Six findings remain: five blocking regressions and one minor finding. All 19 commands in `.factory/claims.json` exit successfully, but the paid report-link test replaces both backend calls with browser mocks. It therefore does not test the advertised paid result. Paid-link durability and payment-data boundaries also remain outside the claims registry. The 404 uses a stale, incomplete footer, and a previously repaired 22-word copy limit has regressed.

## 30-second cold first read

Fresh Chromium contexts were opened before scrolling at 390 × 844 and 1440 × 900.

- **What it does:** Records evidence from screen-reader tasks and orders the results for review.
- **For whom:** Blind founders and small teams fixing a critical dashboard task.
- **What to click first:** **Try it with sample data**.

This gate passes. At 390 px, the first screen shows the exact headline “Record screen-reader task evidence,” the audience sentence “For blind founders and small teams fixing a critical dashboard task,” the primary action, its adjacent result “See five filled tasks and a prioritized report,” and all three facts. No scrolling is needed. The same information is visible at 1440 px. Initial requests are same-origin and neither context logs a console error.

## Findings

### Blocking regressions

#### F-1-5 — Paid report durability is advertised but absent from the claims contract

- **Exact quote/location:** README, Backend: “Private reports are restored from and copied to the mounted durable Azure File volume at `/app/data`.” The next sentence says the deployment contract requires the durable mount and one ready replica.
- **Evidence:** `.factory/claims.json` has no durability or deployment-topology entry. The `team-sharing` browser test fulfills report creation and retrieval itself. The Rust tests copy arbitrary bytes into and out of snapshot paths, but never create a report, restart the application, and retrieve that report through `/api/reports/<id>`. The live topology was described in an earlier handoff, but that command is not part of the current claims manifest.
- **Why this fails:** Team sharing is a paid result. A buyer cannot distinguish a durable private link from one that disappears on a normal restart. This reopens the durability concern from review 1 even though the copy no longer promises a fixed 30-day period.
- **Concrete fix:** Add a `private-report-durability` claim. In its exact manifest command, create a report through the real router with a recorded valid-license response, stop the process, restore from a temporary durable directory, start a second process, and retrieve the same link. Assert that retrieval lasts until the server-provided expiry and fails after expiry. Include the deployment-topology verifier in the claim or remove the README durability statement.

#### F-1-11 — Card, checkout, and refund boundaries are again unlisted or unproved

- **Exact quotes/locations:** README, Team sharing: “Checkout, refunds, and license verification use Sociobot and Dodo.” “The product never handles card details.” Landing: “Sociobot and Dodo handle checkout and refunds.” Privacy: “This product does not receive card details.” Terms: “Sociobot and Dodo are the merchant of record. Their checkout handles refunds.”
- **Evidence:** No `.factory/claims.json` entry states the card-data or merchant-of-record boundary. `privacy-boundaries` records requests during local-audit routes but never follows checkout or inspects the paid flow. `team-sharing` confirms a 303 to a Dodo hostname, but does not assert that this origin has no card fields, payment-provider runtime, or card-data request. `license-revocation` begins with a mocked revoked verdict; it does not prove that a refund causes Sociobot to return that verdict.
- **Why this fails:** These are security and payment claims a buyer can rely on. The same gap was identified in review 1, removed with the old paid offer, and then reintroduced with team sharing.
- **Concrete fix:** Add a `payment-boundary` claim that follows the unpaid checkout handoff, records requests, scans the product UI/bundle for card collection, and confirms card data never enters this origin. Strengthen `license-revocation` with a recorded billing-contract fixture that starts from a refunded purchase and produces the revoked verification result. Remove merchant/refund/card statements that the sandbox cannot prove.

#### F-1-12 — The paid end-to-end claim bypasses the real backend

- **Exact quote/location:** `.factory/claims.json`, `team-sharing`: “A valid $39 Sociobot team-sharing license creates a private report link that opens without an account.” README, Backend: “A verified team-sharing license is required to create a private report link.”
- **Evidence:** `@claim:team-sharing` intercepts `**/api/reports`, returns a fabricated ID, and intercepts the subsequent `GET` with a fabricated report. It never executes `create_report`, `verify_license`, SQLite insertion, `get_report`, or the deployed report API. The untagged Rust test `sharing_requires_a_license` proves only that a request with no token returns 402. It does not prove that invalid tokens are rejected or valid tokens are stored and retrievable.
- **Why this fails:** The command passes while replacing the exact backend behavior named by the claim. The paid job-to-be-done is therefore untested. This reopens the server-enforcement gap from review 1.
- **Concrete fix:** Make the Sociobot verification base URL or verifier injectable in tests. Run an integration test against the actual Axum router and temporary SQLite database: reject missing and invalid tokens, accept a recorded valid response, create the report, open it through a separate clean browser context, and confirm no license is required to read it. Keep the live catalog and 303 checks as separate assertions.

#### F-1-17 — The 404 still does not use the standard footer

- **Exact quote/location:** Live `/missing` and `frontend/public/404.html`: “Record task evidence and fix blockers.” The footer says “Visit Param Factory (external)” and has no version or build ID.
- **Evidence:** The application footer says “Record task evidence and review a prioritized report” and includes `Version 1.1.1 · Build …`. The static 404 retains the older “fix blockers” promise and omits that metadata.
- **Why this fails:** The tool records evidence; it does not fix blockers. The 404 therefore makes an unlisted capability claim and breaks the required consistent shell. Review 1 required the normal header/footer on this route, so this remains a partial fix under the same ID.
- **Concrete fix:** Generate the 404 from the same footer source or keep a parity test. Use “Record task evidence and review a prioritized report,” add the current version/build ID, and use “Built by Param Factory (external).” Add assertions for all footer text, not only link presence.

#### F-1-19 — The README copy limit has regressed

- **Exact quote/location:** README, Deploy, 28 words: “Deployment must apply `.factory/container-scale.json`: mount `screenreader-task-audit-data` at `/app/data` and keep this SQLite deployment at exactly one ready replica unless reports and rate-limit state move to a shared database.”
- **Evidence:** `.factory/copy-audit.md` says every reviewed sentence is at most 22 words, but it omits this 28-word sentence. Review 1 raised the same copy-limit issue and both polish records marked it fixed.
- **Why this fails:** The sentence combines the deployment contract, mount, replica count, and migration exception. Under the required history rule, this copy regression is blocking again with its original ID.
- **Concrete rewrite:** “Apply `.factory/container-scale.json` during deployment. Mount `screenreader-task-audit-data` at `/app/data`. Keep one ready replica unless reports and rate-limit state use a shared database.”

### Minor

#### F-3-1 — The product footer does not use the required factory credit

- **Exact quote/location:** Footer on every route: “Visit Param Factory (external).” The site-structure contract requires “Built by Param Factory.”
- **Why this fails:** “Visit” describes the link action but omits the required product provenance. This is also the low wording gap already acknowledged in the latest handoff.
- **Concrete fix:** Change the visible label to “Built by Param Factory (external)” while keeping the external-link cue and 44 px target.

## Copy audit

Counts treat hyphenated terms, paths, version strings, and URLs as one word. Code blocks are commands rather than sentences. Headings, labels, and actions are audited separately.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| For blind founders and small teams fixing a critical dashboard task. | 11 | — |
| See five filled tasks and a prioritized report. | 8 | — |
| Free audits stay in this browser. | 6 | — |
| The demo works offline after its first visit. | 8 | — |
| Record up to five critical tasks. | 6 | — |
| Focus moves behind the calendar. | 5 | Sample evidence |
| Its days have no accessible names. | 6 | Sample evidence |
| Revenue cells sound blank because the chart has no text alternative. | 11 | Sample evidence |
| The menu and download notice are both announced. | 8 | Sample evidence |
| Choose work that affects revenue, support, or daily operations. | 9 | — |
| Record announcements, focus movement, the result, and any blocker. | 9 | — |
| Export accessible HTML or JSON ordered by result and impact. | 10 | — |
| It records manual observations. | 4 | — |
| It does not scan a product. | 6 | — |
| It does not watch a tester or record page text. | 10 | — |
| It does not collect passwords or analytics data from the product you test. | 13 | — |
| It does not certify accessibility or provide legal advice. | 9 | — |
| Export JSON, then restore the same editable audit. | 8 | — |
| Save up to five critical tasks in this browser. | 9 | — |
| Download accessible HTML or JSON. | 5 | — |
| Create a private link for a teammate. | 7 | — |
| They do not need an account. | 6 | — |
| Sociobot and Dodo handle checkout and refunds. | 7 | F-1-11 |
| HTML and JSON exports stay free. | 6 | — |
| Record task evidence and review a prioritized report. | 8 | — |

### Landing headings, labels, actions, and image text

| Copy unit | Words | Check |
| --- | ---: | --- |
| Task evidence | 2 | Clear label |
| Record screen-reader task evidence | 4 | Clear h1 |
| Try it with sample data | 5 | Result-naming action |
| Sample report | 2 | Clear label |
| Prioritized task evidence | 3 | Clear h2 |
| Change the report date range | 5 | Sample task |
| Find the top-selling product | 4 | Sample task |
| Export the orders report | 4 | Sample task |
| How the audit works | 4 | Clear h2 |
| Name critical tasks | 3 | Clear h3 |
| Record observations | 2 | Clear h3 |
| Export the report | 3 | Clear h3 |
| What this audit does not do | 6 | Clear h2 |
| Local audit | 2 | Clear label |
| What the free audit includes | 5 | Clear h2 |
| Keep your work editable | 4 | Clear h3 |
| Start an audit | 3 | Result-naming action |
| Save task evidence | 3 | Clear h3 |
| Export your report | 3 | Clear h3 |
| Team sharing | 2 | Clear label |
| Share a report with your team | 6 | Clear h2 |
| $39 once | 2 | Exact price |
| Buy team sharing (external) | 4 | Result-naming action |
| Keep the free audit | 4 | Clear h3 |
| Restore a purchase | 3 | Clear h3 |
| Paste your team-sharing license | 4 | Clear label |
| Verify license | 2 | Result-naming action |
| Five paper task slips show keyboard focus and screen-reader sound waves. | 11 | Useful image alternative |
| Visit Param Factory (external) | 4 | F-3-1 |

No landing sentence exceeds 22 words. No banned marketing adjective, metaphor heading, or non-result primary action was found.

### README sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Record screen-reader task evidence for a critical dashboard task. | 9 | — |
| Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. | 13 | — |
| Record observations for up to five critical tasks. | 8 | — |
| Review the tasks in result-and-impact order. | 6 | — |
| Export an accessible HTML report or a JSON backup. | 9 | — |
| This tool records manual observations. | 5 | — |
| It does not scan a product, certify accessibility, or provide legal advice. | 12 | — |
| Open `?demo=1`, `/demo`, or `https://screenreader-task-audit.sociobot.in/?demo=1`. | 5 | — |
| The demo loads five realistic analytics tasks in one click. | 10 | — |
| It uses the separate `demo:sra:audit:v1` browser storage key. | 8 | — |
| Reset demo restores the original sample. | 6 | — |
| Start for real discards the demo key before opening your audit. | 11 | — |
| The service worker makes the demo available offline after its first visit. | 12 | — |
| Setup asks for the tester’s consent before recording. | 8 | — |
| Five task sheets record the starting place, expected steps, announcements, focus, blockers, and notes. | 14 | — |
| Event traces record focus, actions, and announcements when a sequence matters. | 11 | — |
| Reports sort tasks by result and impact. | 7 | — |
| Accessible HTML and JSON exports are free. | 7 | — |
| JSON exports restore the setup, tasks, and event traces after you confirm. | 12 | — |
| Team sharing costs $39 once. | 5 | — |
| It creates a private report link for a teammate who does not need an account. | 15 | F-1-12 |
| Checkout, refunds, and license verification use Sociobot and Dodo. | 9 | F-1-11 |
| A refund revokes the team-sharing license. | 6 | F-1-11 |
| The product never handles card details. | 6 | F-1-11 |
| Choose Buy team sharing on the landing page. | 8 | — |
| After checkout, the return token is stored only in this browser and removed from the URL. | 16 | — |
| “Have a license? Paste it” restores a purchase on another device. | 11 | — |
| The report sends its content to the server only after a verified license holder chooses Create private link. | 18 | F-1-12 |
| Free audits stay in browser storage under `sra:audit:v1`. | 8 | — |
| The local audit does not send task content to a server. | 11 | — |
| The site has no analytics, ads, third-party fonts, or runtime scripts. | 11 | — |
| Requirements: Node 22+, npm, current stable Rust, and SQLite build support. | 11 | — |
| Vite runs the frontend during development. | 6 | — |
| Build the frontend before running the production server: | 8 | — |
| The container needs only `PORT`. | 5 | — |
| It defaults to `8080`. | 4 | — |
| `DATA_DIR` can override the default `data` directory. | 7 | — |
| `BUILD_SHA` can label `/health` but is not required. | 8 | — |
| `npm test` runs unit and Playwright tests. | 7 | — |
| The production frontend lands in `dist/`. | 6 | — |
| Build and run the container: | 5 | — |
| Open `http://localhost:8080/?demo=1` and check `http://localhost:8080/health`. | 5 | — |
| The axum server serves `dist/` and exposes `GET /health`. | 9 | — |
| A verified team-sharing license is required to create a private report link. | 12 | F-1-12 |
| Report API routes validate a report body before storage. | 9 | — |
| They allow no more than five tasks and a 200 KB encoded body. | 13 | — |
| API routes accept a burst of 40 requests from the first `X-Forwarded-For` address. | 13 | — |
| One idle second resets the allowance. | 6 | — |
| Limited responses return `429` and `Retry-After: 1`. | 7 | — |
| SQLite uses one local connection with a rollback journal, because Azure File does not support SQLite’s live locking safely. | 19 | F-1-5 |
| Private reports are restored from and copied to the mounted durable Azure File volume at `/app/data`. | 16 | F-1-5 |
| The versioned container deployment contract requires that durable mount and exactly one ready replica. | 14 | F-1-5 |
| After deployment, verify that public boundary with: | 7 | — |
| The check sends concurrent harmless bursts for one forwarded address. | 10 | — |
| The 41-request burst must return 40 `404` responses and one `429` with `Retry-After: 1`. | 14 | — |
| A 100-request burst must return 40 `404` responses and 60 `429` responses, then recover after one idle second. | 18 | — |
| The checkout check verifies the public USD 39.00 catalog entry and that an unpaid request redirects to a hosted Dodo session. | 21 | — |
| It does not submit payment details. | 6 | — |
| Read `/privacy` and `/terms` in the app. | 7 | — |
| Implementation details live in `.factory/design.md`, `.factory/demo.md`, and `.factory/claims.json`. | 8 | — |
| The factory deploys the root `Dockerfile`. | 6 | — |
| It builds the Vite frontend and Rust server in separate stages. | 11 | — |
| The runtime listens on `PORT` as a non-root user. | 9 | — |
| Deployment must apply `.factory/container-scale.json`: mount `screenreader-task-audit-data` at `/app/data` and keep this SQLite deployment at exactly one ready replica unless reports and rate-limit state move to a shared database. | 28 | F-1-19 |
| MIT. | 1 | — |
| See `LICENSE`. | 2 | — |

### README headings

| Heading | Words | Check |
| --- | ---: | --- |
| Screenreader Task Audit | 3 | Product name |
| Try the demo | 3 | Clear |
| What Screenreader Task Audit includes | 5 | Clear |
| Team sharing | 2 | Clear |
| Develop | 1 | Clear in README context |
| Test and build | 3 | Clear |
| Backend | 1 | Clear in README context |
| Privacy and legal pages | 4 | Clear |
| Deploy | 1 | Clear in README context |
| License | 1 | Clear |

No banned marketing adjective or metaphor heading appears. F-1-19 is the only sentence over 22 words. F-1-11, F-1-12, and F-1-5 mark claim coverage defects rather than wording length.

## Demo and sandbox

**Pass.** The first-screen action enters `/?demo=1` in one click. The first demo screen already shows the “August analytics check” audit, Northstar Metrics, NVDA 2026.1, Firefox 142, five task controls, and the active “Change the report date range” observation sheet.

The persistent banner reads “Demo — sample data, nothing is saved” and contains **Reset demo** and **Start for real**. In a fresh live context:

- no read or write touched `sra:audit:v1` while the demo was open;
- editing the task name changed only `demo:sra:audit:v1`;
- Reset restored “Change the report date range”;
- Start for real removed the demo key and opened the blank real setup;
- reopening Demo restored the original sample;
- all demo-flow requests were same-origin;
- the dedicated clean-context offline claim reloaded the demo successfully after `context.setOffline(true)`.

## Claims

Every exact manifest command was run independently after `git clone --no-hardlinks /work/repo <temporary-directory>` and `npm ci`.

| Claim ID | Exact command result |
| --- | --- |
| `demo-sandbox` | PASS |
| `core-workflow` | PASS |
| `structured-capture` | PASS |
| `five-tasks` | PASS |
| `team-sharing` | PASS command; coverage fails F-1-12 |
| `license-restore-feedback` | PASS |
| `report-priority` | PASS |
| `html-export` | PASS |
| `json-export` | PASS |
| `anonymous-export` | PASS |
| `import-json` | PASS |
| `privacy-boundaries` | PASS command; payment boundary is not its claim |
| `offline-reload` | PASS |
| `saved-audit-offline` | PASS |
| `free-audit-features` | PASS |
| `license-revocation` | PASS command; refund cause is not exercised |
| `manual-evidence-not-certification` | PASS |
| `backend-rate-limit` | PASS |
| `backend-report-validation` | PASS |

The complete 54-test Playwright suite also passes against the live origin at desktop and 390 px. Fresh live boundary checks passed: 41 concurrent requests produced 40×404 and 1×429; 100 produced 40×404 and 60×429; each limited response included `Retry-After: 1`; idle recovery returned 404. The live catalog lists USD 39.00 and unpaid checkout returns 303 to a `checkout.dodopayments.com` session.

No listed command fails. F-1-5, F-1-11, and F-1-12 remain blocking because the corresponding visitor claims are unlisted or replaced by mocks, leaving them untested despite green commands.

## History verification

Every earlier review, polish record, and handoff was read. The checks below use the current live build and current code.

| Earlier finding | Current result |
| --- | --- |
| F-1-1 | Fixed: exact live 40-request allowance and idle recovery pass. |
| F-1-2 | Fixed: live checkout returns 303 to a hosted Dodo session. |
| F-1-3 | Fixed: demo/real activation selects a task from the active namespace; live edits persist correctly. |
| F-1-4 | Fixed: Start for real removes `demo:sra:audit:v1`; direct live check passes. |
| F-1-5 | **Reopened:** paid links returned, while durability remains outside the claims manifest and lacks create/restart/retrieve coverage. |
| F-1-6 | Fixed: loaded and missing shared reports have distinct titles and metadata. |
| F-1-7 | Fixed: `core-workflow` records, reloads, and renders a report. |
| F-1-8 | Fixed: `report-priority` checks complete on-screen and JSON ordering. |
| F-1-9 | Fixed for local audit routes: request and capture logs pass. |
| F-1-10 | Fixed: consent, observation fields, and trace types are tested. |
| F-1-11 | **Reopened:** payment and card-boundary copy returned without a dedicated claim or complete test. |
| F-1-12 | **Reopened:** the paid claim mocks the report backend and does not test server-side verification or storage. |
| F-1-13 | Fixed: route-specific titles, descriptions, canonicals, Open Graph, and Twitter metadata pass live. |
| F-1-14 | Fixed: live 390 px tests verify 44 px targets and no horizontal overflow. |
| F-1-15 | Fixed: manual-observation/no-certification scope remains declared and tested. |
| F-1-16 | Fixed: sitemap lists all static public routes. |
| F-1-17 | **Reopened:** the 404 shell has a stale capability sentence and lacks the standard version/build footer. |
| F-1-18 | Fixed: both external visitor links visibly say “external.” |
| F-1-19 | **Reopened:** the README again contains a 28-word deployment sentence. |
| F-1-20 | Fixed: landing and README section headings name their subjects. |
| F-1-21 | Fixed: critical task, impact, top-selling product, and report remain consistent. |
| F-1-22 | Fixed: public copy uses plain “analytics data” and “asks for consent.” |
| F-1-23 | Fixed: JSON import validates, previews, confirms, and restores every editable field. |
| F-2-1 | Fixed: JSON restores screen reader, browser, and original creation time. |

## Structure, accessibility, and links

These checks pass apart from F-1-17 and F-3-1:

- `/`, `/?demo=1`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms` return 200; `/missing` returns the designed 404.
- Route titles follow the required pattern and each route has one h1 and one main landmark.
- Descriptions, canonicals, Open Graph/Twitter fields, the SVG favicon, apple-touch icon, and 1200 × 630 social image are present.
- The internal route crawl finds no dead link. The checkout link returns 303, and the Param Factory link returns 200.
- History navigation moves focus to the new h1 and announces route changes. Deep links and reloads pass the live suite.
- `/opt/fleet/lib/verify-url.sh` reports no errors on `/` or `/demo`, with `lang=en`, one h1, one main, no missing image alternative, and no unlabeled button.
- Live Axe checks report no serious or critical issue, including dark mode and the 390 px blocked-task controls.
- Reduced motion, 200% text reflow, keyboard task changes, focus restoration, and 44 px touch targets pass.
- The risograph evidence-desk layout follows `.factory/design.md` and is visually distinct from a generic centered SaaS template.

## Missed leverage

No additional AI feature is justified. The product records first-hand observations; automated drafting or classification would risk changing evidence. The brief-implied leverage is already present through JSON import/export and private report sharing. No provider key is embedded and no decorative AI control appears.

## What would make this perfect

Make the paid path independently testable through the real backend, add explicit durability and payment-boundary claims, and prove refund-to-revocation behavior. Restore the standard footer on the static 404, use the required “Built by Param Factory” credit everywhere, and split the 28-word deployment sentence. Then rerun this full review from a clean clone. A PASS requires zero remaining findings and no mocked-away or unlisted claim.
