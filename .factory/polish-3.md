# Polish round 3 — cumulative finding closure

Reviewed source: `.factory/review-1.md`, `.factory/review-2.md`, `.factory/review-3.md`, `.factory/polish-1.md`, and `.factory/polish-2.md`.

Live product: <https://screenreader-task-audit.sociobot.in>

Cold live evidence: [landing desktop](evidence/polish-3-landing/screenshot-desktop.png), [landing mobile](evidence/polish-3-landing/screenshot-mobile.png), [demo desktop](evidence/polish-3-demo/screenshot-desktop.png), [demo mobile](evidence/polish-3-demo/screenshot-mobile.png), [404 desktop](evidence/polish-3-404/screenshot-desktop.png), and [404 mobile](evidence/polish-3-404/screenshot-mobile.png).

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the API limiter keyed by the first forwarded client address and the deployment at one replica. Every limited response includes `Retry-After: 1`. | `cargo test claim_backend_rate_limit`; [live boundary log](evidence/polish-3-live-rate-limit.txt); [live topology log](evidence/polish-3-live-deployment.txt). |
| F-1-2 | The paid action is now a registered $39 team-sharing purchase. The product uses the Sociobot catalog and hosted Dodo checkout instead of a dead or direct provider integration. | `@claim:team-sharing`; `@claim:payment-boundary`; [live checkout log](evidence/polish-3-live-checkout.txt). |
| F-1-3 | Demo task activation stays bound to the demo namespace when moving between real and sample audits. | `@claim:demo-sandbox` in desktop and 390 px projects; [demo mobile](evidence/polish-3-demo/screenshot-mobile.png). |
| F-1-4 | **Start for real** deletes `demo:sra:audit:v1` and never copies sample data into `sra:audit:v1`. | `@claim:demo-sandbox`; cold `/?demo=1` live check. |
| F-1-5 | Added a paid-report durability claim. Its real Axum test creates through `POST /api/reports`, closes the first SQLite runtime, restores the durable snapshot into a second runtime, reads through `GET /api/reports/:id`, and proves the link fails after server expiry. It also asserts the 1/1 Azure File deployment contract. | `cargo test claim_private_report_durability`; [live topology log](evidence/polish-3-live-deployment.txt); `/health` in [live health](evidence/polish-3-live-health.json). |
| F-1-6 | Shared reports set their own complete title, description, canonical, Open Graph, and Twitter metadata; missing IDs switch to the 404 state. | `shared report metadata distinguishes loaded and missing reports`; live route suite. |
| F-1-7 | Kept the complete observation-to-persistent-report workflow in the claims contract. | `@claim:core-workflow`; live desktop and mobile runs. |
| F-1-8 | Kept result-and-impact ordering identical on screen and in JSON. | `@claim:report-priority`; live desktop and mobile runs. |
| F-1-9 | Privacy verification records real local task content and all outgoing requests, then checks for server content transfer, analytics, ads, and capture APIs. | `@claim:privacy-boundaries`; [cold landing verifier](evidence/polish-3-landing/verify.json). |
| F-1-10 | Consent is enforced before recording. Focus, action, announcement, and unexpected-change traces persist into the report. | `@claim:structured-capture` and `@claim:core-workflow`. |
| F-1-11 | Added a payment-boundary claim. It checks that this origin has no card fields, payment iframe, provider runtime, or card request; verifies the USD 39 Sociobot catalog and hosted Dodo handoff; and derives a revoked verdict from a recorded refunded-purchase fixture. | `@claim:payment-boundary`; `@claim:license-revocation`; `tests/fixtures/billing-contract.json`; [live checkout log](evidence/polish-3-live-checkout.txt). |
| F-1-12 | The paid flow no longer mocks the report API. The browser test rejects missing and invalid tokens, uses a recorded local Sociobot verifier, creates through the actual Axum route and SQLite database, and opens the generated link in a separate license-free context. | `@claim:team-sharing`; `cargo test claim_backend_report_validation`. |
| F-1-13 | Every public route has a route-specific title, description, canonical, Open Graph, and Twitter metadata plus one `h1` and one `main`. | `routes have unique metadata, real 404, accessible structure, and 44px targets`; live suite. |
| F-1-14 | Interactive targets remain at least 44 px and 390 px layouts do not overflow. The static 404 build SHA now wraps on small screens. | Mobile browser project; `static 404 keeps links and focus indicators accessible in dark mode`; [landing mobile](evidence/polish-3-landing/screenshot-mobile.png); [404 mobile](evidence/polish-3-404/screenshot-mobile.png). |
| F-1-15 | The scope statement remains explicit: this is manual evidence, not a scan, score, certification, or legal opinion. | `@claim:manual-evidence-not-certification`; live landing. |
| F-1-16 | `sitemap.xml` lists `/`, `/demo`, `/audit`, `/report`, `/demo/report`, `/privacy`, and `/terms`. | Live route suite; link crawl in `routes have unique metadata, real 404, accessible structure, and 44px targets`. |
| F-1-17 | The styled static 404 now uses the standard one-line product description, version and stamped build ID, Privacy and Terms links, factory credit, mobile wrapping, correct metadata, and a real HTTP 404. | `routes have unique metadata, real 404, accessible structure, and 44px targets`; 404 Axe/dark/mobile test; [404 desktop](evidence/polish-3-404/screenshot-desktop.png). |
| F-1-18 | External factory links keep an explicit visible and accessible external-site cue. | Footer assertion on every route; live link crawl. |
| F-1-19 | Split the 28-word deployment sentence into three direct sentences and updated the complete README copy audit. | `.factory/copy-audit.md`; `README.md`; no sentence exceeds 22 words. |
| F-1-20 | Task-specific headings and the tactile evidence-board identity remain; no decorative lore or generic SaaS replacement was introduced. | `.factory/copy-audit.md`; [landing desktop](evidence/polish-3-landing/screenshot-desktop.png). |
| F-1-21 | **Critical task**, **impact**, **top-selling product**, and **report** remain the only terms for those concepts. | `.factory/copy-audit.md`; `@claim:report-priority`. |
| F-1-22 | Plain phrases such as “analytics data” and “asks for consent” remain in landing, setup, and documentation copy. | `.factory/copy-audit.md`; `@claim:structured-capture`. |
| F-1-23 | JSON restore validates the file, previews its exact setup and task data, requires confirmation, and restores setup, creation time, all tasks, and traces. | `@claim:import-json`; unit test `restores setup context and creation time from JSON reports`. |
| F-2-1 | JSON import/export keeps separate screen-reader and browser fields, preserves `created`, and accepts older combined `environment` files. | `@claim:import-json`; unit restore compatibility test. |
| F-3-1 | Every application route and the static 404 now show **Built by Param Factory (external)**. | Route footer assertions; [landing footer](evidence/polish-3-landing/screenshot-desktop.png); [404 footer](evidence/polish-3-404/screenshot-desktop.png). |

## Final acceptance evidence

- Every exact command for all 21 entries in `.factory/claims.json` passed independently from a clean clone.
- Full local gates passed: 8 Vitest tests, 58 Playwright tests with retries disabled, 13 Rust tests, TypeScript, Rust formatting, strict Clippy, production Vite build, release Rust build, and production dependency audit.
- The production bundle is 40.13 KB JavaScript and 10.91 KB CSS before gzip, under the product budgets.
- Cold production browser verification passed 56 applicable checks with retries disabled. The two local-only recorded-license creation cases were skipped live; the live checkout, topology, health, and rate-limit checks passed separately.
- Axe found no serious or critical issue on landing, demo, report, privacy, terms, or 404 routes in desktop and 390 px projects.
- Lighthouse on the cold live demo scored 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. LCP was 1.081 seconds, CLS was 0, and transfer size was 53.6 KB. Raw report: [polish-3-lighthouse.json](evidence/polish-3-lighthouse.json).
- The deployed image reports the expected source at `/health`, has one active healthy revision at 100% traffic, uses one replica, and mounts `screenreader-task-audit-data` at `/app/data`.

No finding from reviews 1, 2, or 3 remains open.
