# Ordered business import: module skills

Read [the Data Bridge protocol](../../../../agent/SKILLS.md) before changing this worker.

## Ownership

This module owns ordered runs, invoice verification, queue orchestration, and read-only report queries.
The additive v6 migration owns its run and invoice tables.
Platform supplies authorization, target routing, and queue dispatch.
Transfer Session supplies validated preparation and transactional table writes.
There are no seeds, offline synchronization, or public domain events.

## Operation

1. Resolve the approved connection pair on the server.
2. Build Common, Masters, and Billing catalogs from public owner policies.
3. Order each group by declared parent relationships.
4. Apply saved verified mappings when table or field names differ.
5. Inspect actual columns, indexes, defaults, and foreign keys.
6. Freeze supported source bounds and fingerprint selected business values.
7. Prepare bounded chunks through Transfer Session.
8. Resolve foreign source records to unambiguous target business identities.
9. Insert missing rows and preserve existing conflicts.
10. Hold new dependent rows when a required parent needs review.
11. Check saved values, source drift, invoice descendants, and target relationships.
12. Save one report with separate paginated row, invoice, and warning views.

For example, a product can reference a unit with a different target numeric ID.
Read the source unit's business values and locate the matching target unit.
Write the target unit ID into the prepared product.
Never copy foreign IDs because their numbers happen to exist in the target.
Apply saved parent mappings recursively when parent names differ.
Do not generalize a selected-row constant into an automatic table-wide rule.
Custom business constants and unsupported required fields block automatic processing.

## Recovery and verification

Persist active chunks before preparation and checkpoint completed chunks.
The trusted parent worker executes chunks through Transfer Session without nested queue waits.
Recover interrupted work by auditing destination state again.
Recovered inserts can count as existing rows. State this in the report.
Terminal reports do not rerun writes.
Hide internal chunk sessions from guided lists and report history.
Retain their IDs for report drill-down.

Invoice verification follows eligible business foreign keys through children and nested descendants.
Compare business values after target ID translation.
Retain deleted history. Flag extra destination children without deleting them.
Missing mappings, ambiguous identities, source drift, and preserved differences require warnings.
Commits remain per table. Never claim one atomic multi-table invoice transaction.
Exclude roles, permissions, runtime commands, provider jobs, and system history.

Run `tools/e2e/data-bridge-business.e2e.ts` with the existing regressions.
Use disposable databases for write tests.
Verify renamed fields, nested children, pagination, denied access, target context, repeat imports, and conflicts.
Keep credentials and private client payloads out of Git and queue progress.
