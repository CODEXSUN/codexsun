# Composition and schema continuity: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Register owner modules and preserve existing migration keys, SQL, checksums, and ledger compatibility. Composition must not acquire business CRUD or business field definitions. New behavior belongs in the correct record owner.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
