# Himsx: core business and ownership

Hospital Information Management System app foundation.

## Ownership boundary

Patient, appointment, admission and clinical workflows are planned, not implemented by the overview.

## Inputs and outputs

- Enable Himsx and seed its view permission.
- Open its authenticated overview and setup guide.
- Design patient/encounter/admission ownership, clinical access and audit before introducing clinical records.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/himsx` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
