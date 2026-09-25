# Q Cafe Migration Dry Run

## Context

QC-0904 requires migration dry runs from the reviewed snapshot with documented import totals, rejected records, and reconciliation results. The reviewed snapshot (`apps/temp/qcafe`) is a legacy code reference, not a database: the current ledger is greenfield from the v1.0.0 foundation, so there is no legacy data to import. The dry run below applies every current lifecycle plan to a clean SQLite database and verifies the ledger.

## Dry Run

Executed 2026-09-24 against a clean SQLite file with `createQcafeLifecyclePlans()`:

- Plans executed: 13 (`qcafe.foundation`, `menu`, `settings`, `pos`, `booking`, `kitchen`, `billing`, `inventory`, `documents`, `backup`, `marketplace`, `accounting`, `sync`). The `qcafe.reports` and `qcafe.policies` modules own no tables and ship no plans, matching the `qcafe.devices` precedent.
- Migrations applied: 29, in declared serial order per module, including the append-only inventory chain `001`–`007`, documents chain `001`–`005`, marketplace `002`, and the movement-source rebuild `006`.
- Seeders applied: 3 repeat-safe seeders (foundation readiness, booking defaults, billing outlet defaults).
- Ledger verification: 32 records verified with matching checksums and serial positions. Zero mismatches.

## Import Totals

- Imported legacy rows: 0. No snapshot import exists by design; all Q Cafe data enters through validated API commands and repeat-safe seeders.
- Rejected records: 0. No descriptor failed, reordered, or changed checksum.

## Reconciliation

- Applied migration identifiers match the declared plan order exactly; the verifier confirms every recorded checksum and refuses startup traffic on any divergence (production startup is read-only by design).
- MariaDB follow-up (2026-09-25): the same plans were applied to the shared development database with `npm run database:migrate`, completing inventory `005`–`008`, documents `001`–`005`, backup `001`, marketplace `001`–`002`, accounting `001`, and sync `001`; `database:verify` confirms 33 lifecycle records. This run exposed a MariaDB-only foreign-key ordering fault in `005` (receipt lines referenced the later-created lots table), fixed by creating lots first with an unchanged migration checksum.
- MariaDB integration tests remain opt-in behind an explicit test database URL.

## Verification

- Evidence: `npm.cmd exec -- tsx` dry-run run above, 29 applied and 32 verified.
- Review date: 2026-09-24. Owner: `apps/qcafe/api/modules/foundation`.
