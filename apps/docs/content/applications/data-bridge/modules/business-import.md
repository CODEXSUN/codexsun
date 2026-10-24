# Data Bridge: Ordered business import

Database Connection has one **Audit and import missing business data** button for the verified pair.
It queues Common, Masters, and Billing in that order.
Each group follows its owner policy and parent dependency order.
Saved verified mappings support different table and field names.

The worker resolves foreign records through target business identity before it inserts missing rows.
It preserves conflicts, retains deleted history, and excludes system access data and Billing runtime jobs.
Unsupported mappings and unresolved parents produce warnings.

One report contains Summary, Common, Masters, Billing, Invoices, and Warnings tabs.
Table drill-down shows source, prepared, saved values, and foreign ID mapping.
Invoice drill-down shows eligible children and nested descendants.
Rows, invoices, and warnings have separate paginated views.

The worker checkpoints chunks and re-audits destination data during recovery.
Final checks detect source drift, missing values, invoice differences, and broken target relationships.
Commits remain per table. An invoice does not have one cross-table transaction.

## Sources and verification

- `devkits/data-bridge/api/src/modules/business-import/`
- `devkits/data-bridge/src/modules/business-import/`
- `tools/e2e/data-bridge-business.e2e.ts`

The disposable integration test covers renamed invoices, line fields, nested assets, target IDs, deleted history, conflicts, and pagination.
It also verifies target context, access denial, one report entry, and repeat imports without duplicate writes.
These checks do not represent a new live client import.
