# Demo sandbox

- URL: `?demo=1` or `/demo` (production: `https://screenreader-task-audit.sociobot.in/?demo=1`). A direct demo load touches only the `demo:sra:audit:v1` browser-storage namespace; it never reads or writes `sra:audit:v1`.
- Storage namespace: `demo:sra:audit:v1`
- Real storage namespace: `sra:audit:v1`
- Reset: choose **Reset demo** in the persistent banner.
- Leave: choose **Start for real**. The `demo:sra:audit:v1` key is removed before the real audit loads. Sample data is never copied.

The sample is an August audit of the fictional Northstar Metrics dashboard. It contains five critical tasks: changing a report date, finding a top product, exporting orders, inviting a teammate, and creating an alert. The results include one critical blocker, one partial result, two completed tasks, one untested task, and a three-event reproduction trace.

The demo needs no account and makes no backend writes. Its data is bundled in `src/model.ts`. After the first online visit, the service worker caches the app shell and demo illustration so the same demo URL reloads offline.

Verifiers can use only `/demo` to test task navigation, local edits, reset, prioritization, anonymization, HTML export, JSON export, keyboard behavior, mobile layout, and offline reload.
