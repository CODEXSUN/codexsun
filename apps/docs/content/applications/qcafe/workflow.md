# Q Cafe: workflow

## Supported sequence

1. Run the supported single-tenant Q Cafe deployment and activate its licence.
2. Sign in using its separate PIN-based login.
3. Configure restaurant masters/tables and available POS/catalog settings.
4. Use the POS billing, payment collection and receipt/Z-report flows documented by the owner README.
5. Package desktop resources and validate printer/receipt behavior on the target device.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
