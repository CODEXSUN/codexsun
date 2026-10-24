# Technical staged transfers: module skills

Read [the reusable operating protocol](../../../../agent/SKILLS.md) and [the handoff](../../../../agent/HANDOFF.md).

## Owned work

Own schema inspection, field rules, stable record selection, preparation, revisions, saved sessions, transactions, and queue execution. Preserve group scope and destination checks. Do not insert business catalogs into the transfer engine. Source snapshots, target re-audits, and correction fingerprints have different guarantees. Inspect and document the executable behavior. Reject stale revisions and unsupported relationships.

## Review contract

Inspect this module's public index, routes, service, types, and persistence roles where present.
A read-only module does not need dummy migrations, seeds, events, or workers.
Keep imports behind public owner contracts except explicit lifecycle composition.
Use strict route contracts and authenticated Super Admin access.
Test denied access, the relevant success path, warnings, persistence, and affected consumers.
Record live evidence separately from isolated tests.
