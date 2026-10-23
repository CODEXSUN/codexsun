# Data Bridge tasks

## Common Core table import

- [x] Keep Data Bridge as a separate Super Admin module and add Common Tables and Table Import Review subpages.
- [x] List all 31 supported Core common tables with per-source/target availability, row counts, compatibility, and saved import state.
- [x] Reuse saved external source connections and active MariaDB target tenants without returning credentials to the browser.
- [x] Add paginated source/target previews, a saved snapshot in Data Bridge-owned tables, and an explicit import action.
- [x] Preserve existing target records by skipping duplicate keys. Roll back other row errors.
- [x] Verify Data Bridge and Platform API/web TypeScript, Data Bridge lint, component docs, module boundaries, and focused route tests.
- [ ] Verify dependency layout and Platform lint/build gates.
- [ ] Apply the additive master database migration and verify only against isolated disposable source/target databases.
- [ ] Verify both pages in an authenticated browser; no real tenant import is part of acceptance.

## Live lookup error correction

- [x] Fix the saved-review lookup failure caused by legacy tables missing `row_count` and snapshot columns through a new tracked v2 migration.
- [x] Apply and verify v2 in local `codexsun_master_db`; verify all 31 common table entries and the `core_bank_names` source/target preview in authenticated external Chrome for `sukraa_cloud_db` → `sukraa_db`.
- [x] Pass five focused tests: three route tests plus fresh and legacy disposable database migration regressions. Verify preservation, saving, and repeat migration.

## Current limits

- [x] Add Common Tables action for queued audit/import of all missing records in discovered parent order, one persisted combined report, progress polling, source-row warning details, and attention-only filtering.
- [x] Pass 11 focused tests, including a disposable 31-table bulk run, changed parent IDs, conflict highlighting, missing source table, repeat-run duplicate prevention, and denied bulk-route authorization.
- [x] Verify the Common Tables action through authenticated external Chrome and the actual database Queue Manager worker: live `sukraa_cloud_db` → `sukraa_db` run completed with 31 successful tables, 520 existing records, zero inserts/duplicates, zero warnings; combined report persisted.
- [ ] Complete full Platform production builds after concurrent CRM `frappeSyncError` type mismatches in duty-assignment, duty-report, and enquiry are resolved. Data Bridge API/web builds, lint, owner boundaries, and focused tests pass.

- [x] With explicit user authorization, import missing local `sukraa_cloud_db` Core data into advanced `sukraa_db`: 31 tables, 144 inserts, 520 source business records verified, 376 pre-existing target rows unchanged, zero warnings or orphaned foreign keys. Persist per-table reports; save before-data snapshot and consolidated report under root `dist/.cache/verification/`.
- [x] Resolve recursive foreign references using parent business unique keys and preserve SQL DATE values. Verify differing parent IDs, missing parents, ambiguity, and date audit round trips in disposable database tests.

- [x] Add persisted per-row pre-import audit and final import report with existing, ready, conflict, inserted, warning, and rollback results. Verify missing inserts, duplicate skips, changed target conflicts, required audit, report persistence, and failed-transaction rollback against disposable databases.

- [x] Save only selected source IDs and selected columns. Show exact persisted selected JSON before import, require visual confirmation, reject missing source rows and omitted required fields, and verify exact two-row insertion with omitted-column defaults in disposable databases.
- [x] Verify the live save for `sukraa_cloud_db` → `sukraa_db`: two source rows, only `name` and `status`, target selection excluded, persisted JSON displayed, and import button gated by review confirmation. No tenant import was executed.

- [x] Add live Table Import Review row checkboxes, selected-row review panel, shared Columns menu, visible-data comparison, match filters, Show data, and Refresh. Sort live pages and new snapshots by ID. Verify live `core_bank_names` against `sukraa_db`, column changes, filters, and selection; pass eight focused tests including database ordering/pagination and comparison semantics.

- Each table is imported independently. Import referenced parent tables before children.
- One review snapshot is limited to 10,000 rows. Previews show up to 100 rows per page.
- Data Bridge does not update or merge matching target records, delete target records, or execute source-provided SQL.
- Full source snapshots are retained in Platform master tables; do not use this workflow for secrets or credentials.

## Combined report row details

Each table has View row results with Imported, Existing, and Warning filters, pagination, source business data, matched target business data, and row messages. New runs persist these snapshots in the existing report JSON; older reports explicitly require a new audit for row details. IDs and sensitive metadata are excluded from the data snapshots. Disposable bulk tests verify inserted, existing, conflict values, and persisted snapshots.

## Version 1.1.46 work log

- [x] Record Common Tables, selected-row import, queued parent-order imports, and combined row verification in the versioned changelog.
- [x] Verify row snapshots in disposable databases: imported values, existing values, differing conflict values, and persisted report reload.
- [x] Verify Data Bridge API/web builds, typechecks, lint, module boundaries, component docs, and dependency layout.
- [x] Confirm View row results buttons appear in authenticated live Chrome. Older runs correctly require a new audit for row snapshots.
- [ ] Run a new live combined import to verify the new row-detail snapshot UI end to end; disposable database verification passed.

- Version gate: `check:versions` passed for 1.1.46. Full `npm run check` stopped at missing Frappe `contact-export` role files after component documentation and cleanup tests passed.

## Guided six-stage import

Database Connections -> Table Mapping -> Field Mapping -> Import Preparation -> Confirm Import -> Import Results.

Each stage has a separate URL and Super Admin sidebar entry. A persisted transfer UUID resumes progress after reload. Tables and fields can have different names. Source tables are discovered from the saved source; destinations are discovered from the selected target database. Table selection, field types, required fields, business unique keys, defaults, generated UUID/time values, and target parents are checked on the server. Foreign fields resolve declared source parents by business data or use an explicit existing destination parent; source IDs are never treated as target parent IDs. No automatic conversion or arbitrary SQL is supported.

The additive v5 master migration stores staged transfer sessions and row snapshots in `data_bridge_transfers`. Earlier changes clear prepared data. Revision checks and database locks reject concurrent or stale edits. Preparation captures only selected records and mapped fields, then audits current destination records. Confirmation queues a tenant-scoped `data-bridge.mapped-import` job. The worker rechecks schemas and duplicates, writes one table transaction, preserves existing/conflicting rows, and persists row outcomes. Each batch supports up to 1,000 selected source IDs; previews and results use 100-row pages. Queued/completed sessions are immutable. Common Tables remains available as the existing shortcut.

Disposable database verification covers different names, invalid stages, sensitive-field exclusion, stale revisions, existing/missing/conflicting records, saved values, wrong-target denial, and idempotent worker repeats. Live stage verification is recorded separately from real-tenant commit verification.

### Six-stage verification evidence (23-10-2026)

- [x] Add all six separate routes and sidebar links, saved-session resume, server stage/revision checks, and invalidation of later prepared data.
- [x] Support different source/target table and field names, target defaults, generated UUID/time, custom values, and verified existing target parents. Metadata is optional when the destination supplies defaults.
- [x] Run nine focused Data Bridge tests. The mapped-transfer regression also checks target-parent validation, case-only data conflicts, rollback of a partly processed batch, and refusal to insert a row that was not approved as missing.
- [x] Pass Data Bridge API/web typechecks, lint, builds, owner boundaries, component docs, dependency layout, full root `npm run check`, and Platform API/web production builds and typechecks.
- [x] Verify all six stages in authenticated external Chrome using `sukraa_cloud_db` -> `sukraa_db`, selected `core_colours` source IDs 2 and 3. Review-only Queue Manager job completed on its first attempt: two existing records, zero inserted, zero warnings. Persisted session `b2d2935c-ce43-46f1-b4ea-2b3957c44904` and completed queue status were checked directly in the master database. No tenant records were written.
- [x] Save browser and SQL proof under root `dist/.cache/verification/data-bridge-six-stage-results.jpg` and `data-bridge-six-stage-live.json`.
- [x] Complete the explicitly authorized live Altex missing-row import. All 659 records saved and verified. See RELEASE-1.1.49.md.

## All destination tables and Altex acceptance

- [x] Replace the guided Core-only catalog and parent restrictions with validated source/destination metadata. Keep the fixed Common Tables shortcut unchanged.
- [x] Add declared-parent resolution across differently named tables and fields, unambiguous full-business-record fallback, nullable parent matching, generated-column handling, sensitive-required-field blocking, and destination-table worker serialization.
- [x] Extend disposable regressions for custom targets outside Core, no-business-index rows and parents, parallel duplicate prevention, renamed foreign fields, missing parents, generated columns, and required secrets.
- [x] Provision local `altex_db` with the current 47-table Core schema; register ALTEX and encrypted `altex_cloud` source without importing client records.
- [x] Verify the six-stage UI before commit with `core_colours` -> `codexsun_bridge_verify_colours`, `name` -> `target_label`, and `status` -> `target_status`. Required mapping errors and explicit confirmation gates work. Results stays locked before commit.
- [x] Read-only audit all 47 Core schemas / 659 rows. The empty destination has 331 ready rows and 328 missing-parent warnings.
- [x] Import all 659 current Altex Core records into a disposable target in parent order: zero warnings/failures. Repeat: 659 existing, zero inserted, zero warnings. Remove the disposable databases.
- [x] Verify source Core checksums unchanged, no queued job for the live prepared session, and zero business rows in the real destination and renamed verification table.
- [x] Pass all 12 focused tests, Platform API/web production builds, and full root check (59 tasks).
- [x] Complete the authorized live Altex import: 47 tables, 659 inserted, zero warnings/failures, 39 completed queue jobs, and 31 foreign-key relationships without orphans. Saved values/counts match and source checksums remain unchanged.
