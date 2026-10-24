# Masters and owned children: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Own the master and child scope. Verify common prerequisites first. Resolve every nested reference by business identity. Preserve existing target records, including approved lifecycle differences. A matching name is insufficient when the declared identity has additional parts. Verify child relationships and extra target records separately.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
