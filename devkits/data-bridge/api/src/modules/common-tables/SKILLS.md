# Common parent tables: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Own the approved common-table policy. Discover schemas and destination dependencies before choosing the order. Resolve parent identities before dependent lookups. Do not assume a location is the first table because its screen appears first. Derive field mapping from live metadata, not a copied client field list.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
