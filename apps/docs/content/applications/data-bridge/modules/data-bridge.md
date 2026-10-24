# Data Bridge: Data Bridge composition

Composes authenticated group routes and retains the original migration ledger and table names.

## Workflow and ownership

The sidebar contains Database Connection, Common Tables, Master Tables, Billing Tables, and Report.
Each table group has Table Mapping, Field Mapping, Import Preparation, Confirm Import, and Results tabs.
Group policies and fixed API clients remain inside their group folders. Shared transfer mechanics use public technical contracts.
New sessions store a server-created destination scope. The server rejects target tables outside that scope.
Existing snapshots, sessions, queue records, and migration checksums remain valid. Hidden legacy routes preserve saved links.

## Sources

- `devkits/data-bridge/api/src/modules/data-bridge/`
- `devkits/data-bridge/README.md`
- `devkits/data-bridge/agent/PLAN.md`

## Verification

Run `tools/e2e/data-bridge-groups.e2e.ts` with the existing Data Bridge integration tests.
The grouped test uses disposable databases. It verifies renamed tables, renamed fields, parent ID translation, access checks, and stored results.
This refactor does not authorize a tenant import.
