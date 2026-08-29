# Screenreader Task Audit

Record screen-reader task evidence for a critical dashboard task.

Screenreader Task Audit is for blind founders, screen-reader testers, and small product teams. Record observations for up to five critical tasks. Review the tasks in result-and-impact order. Export an accessible HTML report or a JSON backup.

This tool records manual observations. It does not scan a product, certify accessibility, or provide legal advice.

## Try the demo

Open `?demo=1`, `/demo`, or <https://screenreader-task-audit.sociobot.in/?demo=1>. The demo loads five realistic analytics tasks in one click. It uses the separate `demo:sra:audit:v1` browser storage key. **Reset demo** restores the original sample. **Start for real** discards the demo key before opening your audit.

The service worker makes the demo available offline after its first visit.

## What Screenreader Task Audit includes

- Setup asks for the tester’s consent before recording.
- Five task sheets record expected steps, announcements, focus, blockers, and notes.
- Event traces record focus, actions, and announcements when a sequence matters.
- Reports sort tasks by result and impact.
- Accessible HTML and JSON exports are free.
- JSON exports can be imported after you confirm the restore.

Free audits stay in browser storage under `sra:audit:v1`. The local audit does not send task content to a server. The site has no analytics, ads, third-party fonts, or runtime scripts.

## Develop

Requirements: Node 22+, npm, current stable Rust, and SQLite build support.

```sh
npm install
npm run dev
```

Vite runs the frontend during development. Build the frontend before running the production server:

```sh
npm run build
cargo run
```

The container needs only `PORT`. It defaults to `8080`. `DATA_DIR` can override the default `data` directory. `BUILD_SHA` can label `/health` but is not required.

## Test and build

```sh
npm test
npm run test:backend
npm run build
```

`npm test` runs unit and Playwright tests. The production frontend lands in `dist/`.

Build and run the container:

```sh
docker build --build-arg BUILD_SHA=local -t screenreader-task-audit .
docker run --rm -p 8080:8080 screenreader-task-audit
```

Open <http://localhost:8080/?demo=1> and check <http://localhost:8080/health>.

## Backend

The axum server serves `dist/` and exposes `GET /health`. Reserved report API routes validate a report body before storage. They allow no more than five tasks and a 200 KB encoded body.

API routes accept a burst of 40 requests from the first `X-Forwarded-For` address. One idle second resets the allowance. Limited responses return `429` and `Retry-After: 1`.

## Privacy and legal pages

Read `/privacy` and `/terms` in the app. Implementation details live in [.factory/design.md](.factory/design.md), [.factory/demo.md](.factory/demo.md), and [.factory/claims.json](.factory/claims.json).

## Deploy

The factory deploys the root `Dockerfile`. It builds the Vite frontend and Rust server in separate stages. The runtime listens on `PORT` as a non-root user.

## License

MIT. See [LICENSE](LICENSE).
