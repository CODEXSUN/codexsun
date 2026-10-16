# Billing: core business and ownership

Commercial documents, payments, allocations, balances and reporting.

## Ownership boundary

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

## Inputs and outputs

- Configure company, financial year, numbering and enabled entry features.
- Create quotations, confirm sales/export sales or purchases using Core contacts/products.
- Post receipts/payments and allocate them to eligible documents.
- Read customer/supplier summaries, stock and GST statements in the current company/year.
- Print/export/mail through the owning public contracts; protect posted records and retain audit.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/billing` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
