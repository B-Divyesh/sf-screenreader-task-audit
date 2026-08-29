# Screenreader Task Audit

Record screen-reader task evidence and turn blockers into a reproducible report.

Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. It keeps an audit focused on five essential dashboard tasks. A tester records the task result, announcements, focus movement, and blockers. The report then orders the evidence by task result and impact.

This is observed task evidence. It is not an automated scan, an accessibility certification, or legal advice.

## Try the demo

Open `/demo` or visit <https://screenreader-task-audit.sociobot.in/demo>. It loads five realistic analytics tasks in one click. The demo uses the separate `demo:sra:audit:v1` local storage key. **Reset demo** restores the original sample. **Start for real** leaves demo mode without copying sample data.

The service worker makes the demo available offline after its first visit.

## What it includes

- A consent-first setup for the product, browser, and screen reader.
- Five structured task sheets with result and impact labels.
- Fields for expected steps, announcements, focus, blockers, and notes.
- An optional local trace for focus, action, and announcement events.
- A prioritized report with free accessible HTML and JSON exports.
- An anonymized export option that removes product and environment names.
- A $39 one-time license for private team links that expire after 30 days.

Free audits stay in browser local storage under `sra:audit:v1`. Audit content is sent to the backend only after a licensed user chooses **Create private link**. The backend stores that shared copy in SQLite for 30 days.

## Develop

Requirements: Node 22+, npm, current stable Rust, and SQLite build support.

```sh
npm install
npm run dev
```

Vite runs the frontend during development. To use shared-report endpoints too, run the Rust server after building the frontend:

```sh
npm run build
cargo run
```

The container needs only `PORT`; it defaults to `8080`. `DATA_DIR` can override the default `data` directory. `BUILD_SHA` can label `/health` but is not required.

## Test and build

```sh
npm test
npm run test:backend
npm run build
```

`npm test` runs unit and Playwright tests. Playwright is pinned to 1.58.2. The production frontend lands in `dist/` with `index.html` at its root.

Build and run the full container:

```sh
docker build --build-arg BUILD_SHA=local -t screenreader-task-audit .
docker run --rm -p 8080:8080 screenreader-task-audit
```

Then open <http://localhost:8080/demo> and check <http://localhost:8080/health>.

## Backend

The axum server serves `dist/`, stores explicitly shared reports in SQLite, and exposes:

- `GET /health`
- `POST /api/reports`
- `GET /api/reports/:id`

API routes accept a burst of 40 requests from the first `X-Forwarded-For` address. One idle second resets the allowance. Continuous bursts cannot refill it while requests are still arriving. Limited responses return `429` and `Retry-After: 1`. The atomic allowance is stored beside reports in SQLite, so independent app instances using the same database cannot multiply it. Report bodies are capped at 220 KB and five tasks. The server verifies the license again before it stores a shared report.

## Privacy and payment

The product has no analytics, ads, third-party fonts, or runtime scripts. Free audits and the demo stay local. License purchase and verification use the Sociobot billing API; Sociobot and Dodo handle payment and refunds. No payment provider code is embedded here.

Read `/privacy` and `/terms` in the app. Implementation details live in [.factory/design.md](.factory/design.md), [.factory/demo.md](.factory/demo.md), and [.factory/claims.json](.factory/claims.json).

## Deploy

The factory deploys the root `Dockerfile`. It builds the Vite frontend and Rust server in separate stages, then runs the server as a non-root user on `PORT`.

## License

MIT. See [LICENSE](LICENSE).
