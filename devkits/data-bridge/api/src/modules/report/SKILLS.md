# Reports and explicit corrections: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Keep row-level outcomes, run attribution, approved differences, and historical results. Completed processing with warning rows must remain a warning in summaries. Do not truncate saved work silently. Read summary metadata without loading every private row payload. Corrections require their own explicit before/after confirmation and stale-data checks. Reports do not authorize writes.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
