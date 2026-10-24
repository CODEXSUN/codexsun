# Data Bridge: Billing Tables

Discovers installed Billing business tables. Excludes runtime queues, activity logs, compliance jobs, caches, and migration assignment history. Owns Billing mapping sessions and its workspace.

## Workflow and ownership

The sidebar contains Database Connection, Common Tables, Master Tables, Billing Tables, and Report.
Each table group has Table Mapping, Field Mapping, Import Preparation, Confirm Import, and Results tabs.
Group policies and fixed API clients remain inside their group folders. Shared transfer mechanics use public technical contracts.
New sessions store a server-created destination scope. The server rejects target tables outside that scope.
Existing snapshots, sessions, queue records, and migration checksums remain valid. Hidden legacy routes preserve saved links.

## Sources

- `devkits/data-bridge/api/src/modules/billing-tables/`
- `devkits/data-bridge/README.md`
- `devkits/data-bridge/agent/PLAN.md`

## Verification

Run `tools/e2e/data-bridge-groups.e2e.ts` with the existing Data Bridge integration tests.
The grouped test uses disposable databases. It verifies renamed tables, renamed fields, parent ID translation, access checks, and stored results.
This refactor does not authorize a tenant import.

## Business-only migration verification (2026-10-24)

- Preserve Core and existing target business records. Do not drop either tenant database.
- Use repository migrations to create missing Billing schema. Do not import source users, roles, permissions, runtime jobs, or migration history.
- Billing table selection excludes activity logs, entry-tool commands, compliance jobs, domain events, dashboard caches, outbox jobs, and legacy assignment records.
- Catalogs follow target foreign-key order. Location parents start with Country, State, District, City, then Pincode.
- New mappings omit audit actors and metadata where defaults exist. Required UUID fields use new target identities.
- Existing-row conflicts remain warnings. Completed sessions with warning rows also show warning in Report.
- Retain soft-deleted invoices and their children as deleted history when the operator chooses that policy. Never reactivate them by omitting deletion state.
- Import parent documents before their child tables. Verify complete invoice business values and every child after all related tables finish.
- Current transfers commit per table. Full invoice comparison verifies the completed aggregate. This does not claim a single transaction across all invoice tables.
- Local rehearsal evidence is under `dist/.cache/verification/billing-rehearsal/`. Backups passed restore and full row-hash comparison before live schema work.
