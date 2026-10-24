# Core Masters verification

Verified locally on 2026-10-23 with explicit operator authorization to migrate SUKRAA and ALTEX.

## Behavior

The separate Core Masters page lists 16 master and child tables.
Contacts, companies, products, and work orders use the same preview and review controls as Common Tables.
The bulk queue imports all 47 Core tables in target foreign-key parent order.
Common Tables keeps its 31-table catalog and separate saved report.
No schema migration is needed for the optional report scope stored in existing JSON.
Existing unique-key conflicts remain warnings. No update, merge, or delete was performed.

## Live results

| Check | ALTEX | SUKRAA |
|---|---:|---:|
| Missing rows inserted | 0 | 200 |
| Exact business matches on repeat | 659 | 724 |
| Repeat inserts | 0 | 0 |
| Preserved conflicts | 0 | 2 |
| Foreign-key relationships checked | 31 | 31 |
| Orphan references | 0 | 0 |
| Source unchanged | Yes | Yes |

ALTEX is green across all tables. SUKRAA contacts, companies, work orders, and child tables passed.
One SUKRAA product has a different `unit_id` for an existing unique name.
The existing SUKRAA default company setting has different `company_id` and `landing_app` values.
These two records need an explicit operator choice. Their existing target values were preserved.

## Proof

- [Per-master verification](verification/core-masters-live-proof.md)
- [Per-table machine-readable checks](verification/core-masters-live-proof.json)
- [First import counts and warnings](verification/core-masters-first-live-report.json)

Queue reports remain available on the Core Masters page for each connection pair.
The report drill-down shows the exact source and matched target record for each warning.
Proof summaries omit credentials and personal row payloads.

## Regression coverage

Disposable tests verify master imports, parent ID translation, child records without natural unique indexes, and idempotent repeats.
The Common Tables regression still checks all 31 tables and preserves conflicting records.
The guided transfer regression still checks renamed tables/fields, required fields, stale edits, rollback, and exact case differences.

## Final checks and browser proof

All 12 focused tests and the full workspace check passed.
Data Bridge API/web and Platform web typechecks passed. Owner lint passed.
Authenticated Chrome verified both scoped reports, the warning drill-down, and the master table review toolbar.

- [ALTEX success screenshot](verification/core-masters-altex.jpg)
- [SUKRAA conflict screenshot](verification/core-masters-sukraa.jpg)


## Resolved on 2026-10-24

The operator explicitly approved both SUKRAA corrections. They completed through the prepared source-collection and target-ID confirmation flow.
The new audit verifies 726 matches across all 47 Core tables, with zero warnings and zero inserts.
Source checksums, target identities, unrelated fields, and row counts remain unchanged.
See [final SUKRAA proof](SUKRAA-CORRECTIONS-2026-10-24.md). The earlier warning counts above describe the previous audit.
