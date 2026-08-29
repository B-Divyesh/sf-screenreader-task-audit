# Review 2 handoff

## Status: FAIL

This review did not modify product code. It added `.factory/review-2.md` and this handoff only.

One blocking issue remains: JSON export/import loses the screen-reader and browser setup fields. A live fresh-context repro exported `NVDA 2026.1 · Firefox 142`; after import, both restored fields were empty and the report showed `Restore product · ·`.

## Verification performed

- Cold live checks at 390 × 844 and 1440 × 900: first-read gate passed.
- Direct live demo: realistic sample, banner, isolated demo storage, Reset demo, Start for real, and same-origin request log passed.
- Live crawl: public routes, metadata, 404, header/footer, and links passed.
- Fresh-clone claim commands and quality gates were run. The 30-test browser suite passed in desktop and mobile; declared claim tests passed. See `review-2.md` for the complete command/result record.
- Read and checked every prior review, polish, and handoff finding. F-1-23 is partially fixed and reopened as F-2-1.

## Next step

Update the JSON schema and importer to preserve `assistiveTech` and `browser`, then extend `@claim:import-json` with a full setup-and-task round-trip assertion. Rerun the adversarial review from a fresh browser profile.
