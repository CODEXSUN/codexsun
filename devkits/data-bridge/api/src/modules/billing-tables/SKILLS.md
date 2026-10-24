# Billing business migration: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Keep only business data in the catalog. Exclude runtime queues, events, caches, activities, command history, and migration assignment records. Resolve company, period, party, address, product, and lookup references through discovered identities. These are relationship examples, not a fixed field recipe. Verify full documents, children, totals, and available signed assets. Preserve historical document numbers. Treat numbering settings and lifecycle conflicts as explicit operator decisions. Do not regenerate compliance documents or replay provider jobs. Current execution commits per table, then verifies the complete aggregate.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
