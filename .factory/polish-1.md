# Polish round 1 — finding closure

Candidate repaired: `1e31b77a8fc5df228e6fee7db7f0823ac0af56b8`  
Live URL: <https://screenreader-task-audit.sociobot.in/?demo=1>

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the SQLite-backed 40-request limiter and set the deployed Container App to exactly one replica. | Live 100-request fixed-IP burst: 40 × 404, 60 × 429, 60 `Retry-After: 1`; `cargo test claim_backend_rate_limit`. |
| F-1-2 | Removed the unavailable paid offer and checkout link. | Live landing/reports have no checkout action; `rg` review and `npm test`. |
| F-1-3 | Audit activation now resets the active task only when the storage namespace changes. | `@claim:demo-sandbox` edits real → demo → real and reloads both namespaces. |
| F-1-4 | **Start for real** deletes `demo:sra:audit:v1` before loading real storage. | `@claim:demo-sandbox`; live demo banner screenshot. |
| F-1-5 | Removed the unsupported 30-day private-link offer and its durability promise. | Live landing, README, privacy, and terms no longer advertise it. |
| F-1-6 | Valid shared reports now set “Shared report — Screenreader Task Audit”; failed fetches use the 404 state. | Route metadata test and source route assertion. |
| F-1-7 | Added the tested core observation → persistent report workflow claim. | `@claim:core-workflow`. |
| F-1-8 | Added a complete ordering claim for screen and JSON output. | `@claim:report-priority`. |
| F-1-9 | Added request, capture-call, and public-route privacy coverage. | `@claim:privacy-boundaries`. |
| F-1-10 | Added consent and all named trace-event coverage. | `@claim:structured-capture`. |
| F-1-11 | Removed payment collection and checkout claims with the disabled paid path. | Live landing and legal pages; no payment UI/runtime requests. |
| F-1-12 | Added exact backend claims for task/body validation and rate enforcement. | `cargo test claim_backend_report_validation`; `cargo test claim_backend_rate_limit`. |
| F-1-13 | Navigation sets route-specific title, description, canonical, Open Graph, and Twitter fields. | Route metadata browser test; live full browser suite. |
| F-1-14 | All anchors have 44 px minimum targets; mobile bounding boxes are tested. | Route/mobile test; [mobile screenshot](evidence/polish-1-demo-mobile.png). |
| F-1-15 | Registered the manual-evidence/no-scan/no-certification scope statement. | `@claim:manual-evidence-not-certification`. |
| F-1-16 | Added `/report` and `/demo/report` to the sitemap. | `frontend/public/sitemap.xml` and live route test. |
| F-1-17 | Rebuilt static 404 with header, footer, metadata, favicon, theme color, and plain “Page not found” wording. | Route/axe test on `/missing`. |
| F-1-18 | External Param Factory link now says “Visit Param Factory (external)” in its visible and accessible name. | Live header/footer browser test. |
| F-1-19 | Rewrote README deployment guidance in short, direct sentences. | `.factory/copy-audit.md`. |
| F-1-20 | Replaced vague headings and removed decorative provenance footer copy. | Landing and README copy audit. |
| F-1-21 | Standardized “critical task,” “impact,” “top-selling product,” and “report.” | `.factory/copy-audit.md`; `@claim:report-priority`. |
| F-1-22 | Replaced “analytics payloads” and “consent-first” wording with plain terms. | Landing, setup, README, and copy audit. |
| F-1-23 | Added local JSON import with validation, preview, and explicit restore. | `@claim:import-json`. |

Visual evidence: [desktop demo](evidence/polish-1-demo-desktop.png) and [mobile demo](evidence/polish-1-demo-mobile.png). Both are cold live captures from 29 August 2026.
