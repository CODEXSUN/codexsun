# Data Bridge plan

## Ownership

Data Bridge is an independent Super Admin DevKit. It owns common-table import behavior, row snapshots, and import status. Platform composes its routes and supplies authenticated actors and active tenant connections. Data Migration owns saved external sources and exposes a narrow server-only resolver contract; it does not own Data Bridge records or import behavior.

## Workflow

1. Select an existing source connection and an active registry tenant.
2. Review all 31 fixed Core common table names and see whether each exists on both sides, its row counts, schema readiness, and saved import status.
3. Open a table, compare source and target data, choose visible columns and source rows, and save only that selection as a frozen snapshot. Source IDs identify records independently of pagination and visible columns. The server validates and reads the selected records; target selections never enter the import.
4. Review the saved selected JSON and confirm it before explicitly importing the snapshot. Matching unique records are skipped; inserts run atomically per table. Schema drift blocks import.
5. From Common Tables, queue an audit/import for all missing business records. The module-owned worker discovers parent order and persists progress and one combined report. It highlights only warnings with table/source-row context. Queue Manager owns durable dispatch; Data Bridge owns all import decisions.

## Safety and limits

- Browser requests contain source IDs, registry tenant IDs, fixed table names, page numbers, saved batch IDs, selected source row IDs, and selected shared column names. They never contain database credentials, routing database names, SQL, or insert row values. The server validates field names against both live schemas and binds source IDs.
- Table and field identifiers are fixed or validated; query values use parameters.
- The Common Tables shortcut copies only same-named fields supported by the target. Missing required fields and shared type mismatches block staging.
- A saved snapshot is capped at 10,000 rows. Preview pages contain at most 100 rows.
- Duplicate key errors skip that row without overwriting destination data. Other errors roll back the full table transaction and leave a visible failed status.
- Individual reviews require the operator to import parents first. The all-table worker discovers parent order from target foreign keys and rejects cycles/unsupported parents. Saving translates selected foreign IDs by recursively resolving parent business unique keys; missing or ambiguous target parents block saving.
- Imported snapshots are retained for review. No live import should be used as a test.

## Verification

Run component documentation, owner API/web typecheck and lint, module boundaries, Platform API/web typecheck/lint/build, dependency layout checks, isolated MariaDB migration/import integration tests, and authenticated browser navigation. Report each gate separately.

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

## Core Masters scope

A separate Core Masters page lists the 16 master/child tables. Its queue report uses scope `masters` and imports the 47-table parent closure.
Common Tables retains scope `common` and its original 31-table behavior. Reports persist their scope in existing JSON, without a schema migration.
The existing same-name review APIs accept the explicit 47-table Core catalog. Guided imports continue to support discovered custom targets.
Both workflows share parent resolution and destination table locks. Existing unique-key conflicts stay visible and preserve target values.
Live acceptance must distinguish actual matches from preserved conflicts. SUKRAA has two such conflicts, documented in CORE-MASTERS-VERIFICATION.md.

## Source collection and correction contract

Prepare each selected record from source business values. Collect declared parent values and resolve their target identities before comparing or writing business data.
Normal imports preserve conflicts. The separate Super Admin correction contract prepares immutable business snapshots and fingerprints in the existing master report JSON.
Confirmed commits revalidate source, parent values, schema, destination identity, and before-data under destination table/row locks.
Only approved business fields change. Transaction rollback and idempotent recovery protect failed retries. Fresh audits retain independent post-commit proof.
The approved SUKRAA product-unit and company-default corrections completed on 2026-10-24. All 47 Core tables now pass with 726 verified matches.
