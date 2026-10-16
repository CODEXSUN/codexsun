# Billing: workflow

## Supported sequence

1. Configure company, financial year, numbering and enabled entry features.
2. Create quotations, confirm sales/export sales or purchases using Core contacts/products.
3. Post receipts/payments and allocate them to eligible documents.
4. Read customer/supplier summaries, stock and GST statements in the current company/year.
5. Print/export/mail through the owning public contracts; protect posted records and retain audit.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
