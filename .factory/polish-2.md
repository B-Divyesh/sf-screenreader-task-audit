# Polish round 2 — cumulative finding closure

Candidate repaired: `43a0ba6a947306ed49d84d34d0bad8404d13deba`  
Review commit: `4c0e1ec6af170022d35732f70843a4c844b9ab5c`  
Product commits: `6f84525935fe84659757bb9b8f8495a67cd35e36`, `703b5ef1fe1393384aee58826da60a51be58f105`  
Live URL: <https://screenreader-task-audit.sociobot.in/?demo=1>

Cold live screenshots: [landing desktop](evidence/polish-2-landing/screenshot-desktop.png), [landing mobile](evidence/polish-2-landing/screenshot-mobile.png), [demo desktop](evidence/polish-2-demo/screenshot-desktop.png), and [demo mobile](evidence/polish-2-demo/screenshot-mobile.png).

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the SQLite-shared limiter and set the deployed Container App to exactly one replica after the work-order deployment. | `cargo test claim_backend_rate_limit`; cold live 100-request burst: 40 × 404, 60 × 429, `Retry-After: 1`, then 404 after 1.1 seconds; Azure reports `min=1,max=1`. |
| F-1-2 | Kept the unavailable paid checkout and team-sharing offer out of all visitor copy and links. | `@claim:privacy-boundaries`; live route/link crawl in the 32-test production browser suite; no checkout link is present. |
| F-1-3 | Kept namespace-aware task activation when moving between real and demo audits. | `@claim:demo-sandbox` edits, leaves, reloads, and checks each namespace; 2 desktop/mobile live passes. |
| F-1-4 | **Start for real** removes `demo:sra:audit:v1` before opening the real audit. | `@claim:demo-sandbox`; [live demo mobile](evidence/polish-2-demo/screenshot-mobile.png); direct cold `?demo=1` check. |
| F-1-5 | Kept unsupported paid 30-day link promises out of landing, report, legal, and README copy. | Visitor copy review plus live 32-test route crawl; no paid retention promise appears. |
| F-1-6 | Added complete shared-report metadata. A loaded report uses the shared title and previews; a missing ID switches to 404 metadata. | `shared report metadata distinguishes loaded and missing reports`; live production browser suite. |
| F-1-7 | Kept the observation-to-persistent-report workflow as a declared claim. | `@claim:core-workflow`; live desktop/mobile passes. |
| F-1-8 | Kept complete result-and-impact ordering across screen and JSON. | `@claim:report-priority`; live desktop/mobile passes. |
| F-1-9 | Kept public-route request logging and capture-API inspection. | `@claim:privacy-boundaries`; live desktop/mobile passes with no external or `/api` audit requests. |
| F-1-10 | Kept consent enforcement, every observation field, and focus/action/announcement traces. | `@claim:structured-capture` and `@claim:core-workflow`; live desktop/mobile passes. |
| F-1-11 | Kept payment collection, card fields, provider scripts, and checkout claims out of the product. | `@claim:privacy-boundaries`; live request log and visitor-link crawl. |
| F-1-12 | Kept exact server validation at five tasks and a 200,000-byte encoded report boundary. | `cargo test claim_backend_report_validation`; `cargo test` 7/7. |
| F-1-13 | Added route-by-route assertions for title, description, canonical, Open Graph, and Twitter metadata, including loaded and missing shared reports. | `routes have unique metadata, real 404, accessible structure, and 44px targets`; shared metadata test; 32 live passes. |
| F-1-14 | Kept 44 px minimum targets and no 390 px horizontal overflow. | Mobile route test; [landing mobile](evidence/polish-2-landing/screenshot-mobile.png). |
| F-1-15 | Kept the manual-observation, no-scan, no-score, and no-certification scope statement as a claim. | `@claim:manual-evidence-not-certification`; live desktop/mobile passes. |
| F-1-16 | Kept all public routes in `sitemap.xml`. | Live crawl: `/`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms` returned 200. |
| F-1-17 | Kept the styled static 404 shell with plain wording, metadata, header, footer, and a route home. | Production `/missing` returned 404; route metadata test; Axe pass in live suite. |
| F-1-18 | Kept the visible and accessible “Visit Param Factory (external)” label. | Route/link assertions and live footer screenshots. |
| F-1-19 | Kept every README sentence at 22 words or fewer. | `.factory/copy-audit.md`; manual cumulative copy review. |
| F-1-20 | Kept section headings task-specific and removed decorative provenance copy from visitor pages. | `.factory/copy-audit.md`; [landing desktop](evidence/polish-2-landing/screenshot-desktop.png). |
| F-1-21 | Kept **critical task**, **impact**, **top-selling product**, and **report** consistent. | `.factory/copy-audit.md`; `@claim:report-priority`. |
| F-1-22 | Kept the plain phrases “analytics data” and “asks for consent.” | `.factory/copy-audit.md`; `@claim:structured-capture`. |
| F-1-23 | Completed JSON restore with validation, preview, confirmation, and full setup/task/trace restoration. | `@claim:import-json` creates every field, imports in a second clean context, reloads, and compares the saved audit and report exactly. |
| F-2-1 | Exported separate setup fields, restored both, preserved `created`, supported older combined `environment` exports, and showed setup context in the preview. | `@claim:import-json` desktop/mobile live passes; unit test `restores setup context and creation time from JSON reports`. |

## Final acceptance evidence

- Every one of the 14 commands in `.factory/claims.json` passed independently from a clean clone.
- Full frontend: 4 Vitest tests and 32 Playwright runs passed in desktop Chromium and 390 × 844 mobile Chromium.
- Full backend: formatting, strict Clippy, 7 Rust tests, and release build passed.
- Production cold suite: 32/32 browser runs passed against the live origin.
- `/opt/fleet/lib/verify-url.sh` passed on `/` and `/?demo=1`; both reports contain zero console errors, one `h1`, one `main`, `lang=en`, and no missing image alternatives.
- Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1,651 ms, CLS 0, TBT 0 ms. Raw report: `.factory/lighthouse.json`.
- Production image: `sociobotregistry.azurecr.io/sf-screenreader-task-audit:703b5ef1fe13`; `/health` returns the full source SHA.

No finding from review 1 or review 2 remains open.
