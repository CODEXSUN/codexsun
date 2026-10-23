# Data Bridge: Common Table Import

Data Bridge owns the Super Admin common-table import workflow, saved review snapshots, audits, and combined reports.
Platform owns authentication, tenant-registry resolution, and durable queue dispatch.
Data Migration owns external source credentials and supplies a narrow server-side resolver contract.

## Source contracts

- `devkits/data-bridge/api/src/modules/common-table-import/index.ts`
- `devkits/data-bridge/src/modules/common-table-import/`
- `devkits/data-bridge/README.md`
- `devkits/data-bridge/agent/TASK.md`

## Access and data boundaries

The server validates the fixed Core table allowlist, shared columns, selected source IDs, and target schema.
Browser input cannot supply credentials, SQL, database names, or arbitrary inserted row values.
Imports preserve existing target rows and require the saved review and audit workflow.
Resolve foreign references through parent business keys. Source numeric IDs do not prove target identity.

## Verification limits

The owner TASK records exact historical source, database, and browser evidence.
This developer reference adds documentation coverage only. It does not run or authorize an import.
Use disposable databases for regression verification. No tenant import was performed while adding this reference.
