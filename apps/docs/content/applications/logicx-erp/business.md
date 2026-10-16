# LogicX ERP: core business and ownership

ERP overview and Billing-linked scheme operations.

## Ownership boundary

Scheme rules stay in LogicX ERP; shared masters and financial documents keep their original owners.

## Inputs and outputs

- Enable the app and confirm the active tenant.
- Enable Billing before opening Scheme management.
- Select parent/master references and maintain scheme data through the scheme owner.
- If Billing is disabled, Scheme navigation is hidden and direct URLs return to Overview.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/logicx-erp` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
