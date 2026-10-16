# CRM: workflow

## Supported sequence

1. Configure Local or verified Frappe enquiry data source.
2. Capture a contact/enquiry and verify phone matches and duplicate candidates.
3. Assign/enrich the enquiry, record comments and start/stop work activity.
4. Collect estimates and change enquiry status with record-scope access checks.
5. Use Contact 360 and scoped lists/reports; review source limitations.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
