# HRMS: core business and ownership

Human Resource Management System app foundation.

## Ownership boundary

Only the authenticated foundation is implemented. Workforce CRUD and payroll are planned; do not claim employee data is present.

## Inputs and outputs

- Enable HRMS through effective app access and seed its view permission.
- Open Overview and Getting Started from its own desk.
- Use verified session/tenant context to plan employee, attendance, leave, recruitment and payroll modules.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/hrms` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
