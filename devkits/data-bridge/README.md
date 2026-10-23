# Data Bridge

Data Bridge is a Super Admin DevKit for staged database imports. Platform composes its pages and supplies authenticated tenant-registry access. Data Bridge owns its common-table import API, schema, review snapshots, and import status.

## Scope

- **Overview** is the Data Bridge landing page.
- **Common Tables** lists 31 supported Core common tables with availability and schema compatibility for a selected saved source and registered target tenant.
- **Audit & import all missing rows** creates a tenant-scoped Queue Manager job and one persisted combined report. The worker derives parent order from target foreign keys, selects shared business columns, resolves target parents, audits each source row, and imports only missing records. Existing data is preserved. Conflicts, unavailable tables, unsupported business keys, and missing parents are listed with source row IDs where available. Only affected tables/records are highlighted; **Needs attention only** filters the report. Completed runs refresh counts automatically. Repeating a run skips existing records.
- **Table Import Review** shows paginated source and target data for one table, saves only selected source rows and columns, and previews that saved payload before import into the selected target.
- Both previews and new snapshots sort by `id` ascending when available, then fall back to primary keys. The review toolbar supports multiple visible columns, comparison of the current pages and visible fields, and match/unmatched visibility filters. Redacted values do not produce match results. Saving captures only checked source row IDs and columns selected in the Columns menu. Target checkboxes are comparison only. Refresh clears the selection.
- Existing external source credentials are resolved on the server through Data Migration's narrow internal source-access contract. Credentials are never returned to the browser or copied into Data Bridge records.
- The Common Tables shortcut uses same-named target columns. Missing required fields or differing shared field types block the import. Duplicate keys remain unchanged and are counted as skipped. Other database errors roll back the table transaction.
- Saved batches contain up to 10,000 selected source rows and are stored in Platform master tables owned by Data Bridge. The server fetches selected IDs, rejects missing rows or invalid/sensitive columns, and requires fields without target defaults. It stores only selected field values. The saved JSON preview and review checkbox precede import. Import referenced parent tables before dependent tables.
- **Audit selected rows** checks every saved row against the current target using the selected values and complete selected unique keys. Exact matches and unique-key conflicts are skipped. The persisted report shows ready, existing, conflict, inserted, warning, and rollback outcomes with operator and timestamp. Import requires an audit and rechecks each row inside the target transaction. A per-review database lock serializes audit/import requests. Saving a new selection clears the old report.
- Foreign references in selected fields are resolved through parent business unique keys, recursively matching the source parent to the target parent. Missing or ambiguous parent matches block saving; import parents first. Numeric source IDs are not assumed to identify the same target record. SQL dates remain date strings throughout snapshots and import.

## Ownership

Data Bridge owns common-table import behavior, snapshots, and lifecycle. Platform owns Super Admin authentication, navigation, composition, and active registry tenant resolution. Data Migration owns external source credentials and exposes a narrow server-side resolver contract; it does not own Data Bridge import behavior.

The API lives under `api/src/modules/common-table-import/`; the two page workspaces and fixed API client live under `src/modules/common-table-import/`. Public package contracts are `@codexsun/data-bridge-api` and `@codexsun/data-bridge-web`.

## Verification

The tracked `data-bridge.common-table-import-snapshots-v2` migration upgrades older review tables with snapshot columns and row audit attribution. It preserves existing rows and counts. Legacy reviews without a schema snapshot must be saved again before import.

Run the focused database regression with `node --env-file=.env --import tsx --test tools/e2e/data-bridge.e2e.ts`. It uses disposable databases to verify fresh installation, legacy upgrade, preserved snapshots, saving, and repeat migration.

Run `tools/e2e/data-bridge-bulk.e2e.ts` and `tools/e2e/data-bridge-references.e2e.ts` with the same Node flags for combined parent-order, idempotency, warning, and foreign-reference checks. Combined reports require the additive v4 master migration and an enabled Queue Manager worker. Database and BullMQ backends use the same processor and tenant-bound payload.

Run API/web typecheck and lint, `node tools/check-module-boundaries.mjs data-bridge`, Platform API/web checks, component documentation checks, dependency layout checks, and isolated MariaDB/browser verification. Never test an import against a real tenant.

## Combined report row details

Each table has View row results with Imported, Existing, and Warning filters, pagination, source business data, matched target business data, and row messages. New runs persist these snapshots in the existing report JSON; older reports explicitly require a new audit for row details. IDs and sensitive metadata are excluded from the data snapshots. Disposable bulk tests verify inserted, existing, conflict values, and persisted snapshots.

## Guided six-stage import

Database Connections -> Table Mapping -> Field Mapping -> Import Preparation -> Confirm Import -> Import Results.

Each stage has a separate URL and Super Admin sidebar entry. A persisted transfer UUID resumes progress after reload. Tables and fields can have different names. Source and destination base tables are discovered from their selected databases. The guided workflow is not restricted to the 31-table Common Tables shortcut. Table selection, field types, required fields, business unique keys, defaults, generated UUID/time values, and target parents are checked on the server. Foreign fields resolve declared source relationships to destination parents by shared business keys, or by an unambiguous full business-record match when no business unique key exists. Operators can also choose an explicit existing destination parent. Source IDs are never treated as destination IDs. No automatic conversion or arbitrary SQL is supported.

The additive v5 master migration stores staged transfer sessions and row snapshots in `data_bridge_transfers`. Earlier changes clear prepared data. Revision checks and database locks reject concurrent or stale edits. Preparation captures only selected records and mapped fields, then audits current destination records. Confirmation queues a tenant-scoped `data-bridge.mapped-import` job. The worker rechecks schemas and duplicates, writes one table transaction, preserves existing/conflicting rows, and persists row outcomes. Each batch supports up to 1,000 selected source IDs; previews and results use 100-row pages. Queued/completed sessions are immutable. Common Tables remains available as the existing shortcut.

Disposable database verification covers different names, invalid stages, sensitive-field exclusion, stale revisions, existing/missing/conflicting records, saved values, wrong-target denial, and idempotent worker repeats. Live stage verification is recorded separately from real-tenant commit verification.

Verification gates: Data Bridge and Platform API/web typechecks and production builds passed, along with focused lint, owner boundaries, component docs, dependency layout, and full `npm run check`. Live Chrome traversed all six stages and the database Queue Manager worker completed session `b2d2935c-ce43-46f1-b4ea-2b3957c44904`: two existing records, zero inserts, zero warnings. The v5 master migration is applied locally. Renamed table/field insertion, safe text widening, foreign-parent choices, transaction rollback, and stale-destination handling were verified in disposable databases. Source selection requires one integer primary key named `id`. Safe text/integer widening is accepted; narrowing and incompatible types are blocked. Metadata defaults to destination behavior where available, with explicit ID/UUID/custom field rules. Business-key comparison excludes identity/audit metadata and reports textual differences even under a case-insensitive destination collation.

## All-target support and Altex verification (23-10-2026)

Guided imports list all base tables in the selected destination database, including master, organisation, child, and custom tables. The Common Tables shortcut remains limited to its 31 fixed masters. Source selection requires a single integer primary `id`; destination imports require InnoDB and valid mapped fields. Required sensitive fields, unsupported composite references, incompatible field types, and ambiguous parents are blocked before import. Generated columns remain destination-owned. Names with spaces and hyphens are quoted and validated against live metadata.

When no mapped business unique key exists, duplicate checks compare the mapped business record. A per-destination-table advisory lock serializes Data Bridge workers. Parent resolution covers all discovered tables and rejects missing or ambiguous matches. Read-only preparation can show missing-parent warnings until parent records are imported.

Local setup verified the existing `altex_cloud_db` (96 tables) and provisioned a new `altex_db` through Core's public schema migration (47 Core tables, no business seeds). ALTEX target and encrypted `altex_cloud` source registrations were saved. An empty `codexsun_bridge_verify_colours` table is retained for the renamed-field preview; it has no imported rows. The target currently exposes 49 base tables, including its migration ledger and that verification table.

Live Chrome verified connections, different table names, required-field blocking, `name -> target_label` and `status -> target_status`, selected rows, persisted preparation, explicit confirmation gating, and the locked Results page before commit. Session `f4d907d9-281f-46a3-8cd1-76b14561775c` remains prepared with two ready records and no queued job.

All 47 current Core schemas passed read-only verification across 659 source rows. Against the empty real destination, 331 records were ready and 328 correctly required parents first. A separate disposable Core target then imported all 659 records in discovered parent order with zero warnings or failures. Repeating the full run found 659 existing records, zero inserts, and zero warnings. Disposable databases were removed. Source Core checksums remained unchanged; the real `altex_db` Core tables and renamed verification table remain empty.

Proof artifacts are under root `dist/.cache/verification/`: `altex-core-preimport-report.json`, `altex-core-disposable-import-report.json`, and `altex-live-six-stage-proof.json`. These are local verification outputs, not deployment evidence.

## Live Altex acceptance

The authorized local import completed with 659 records across all 47 Core tables and zero warnings or failures.
Saved business values, row counts, queue completion, foreign references, and unchanged source checksums were verified.
See [release log and proof](agent/RELEASE-1.1.49.md).
