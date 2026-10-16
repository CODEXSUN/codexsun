# Frappe: core business and ownership

Verified external provider connection, source selection and synchronisation.

## Ownership boundary

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

## Inputs and outputs

- Configure and verify the tenant provider connection.
- Map users and select provider-owned data sources.
- Preview enquiry/catalog data through fixed provider contracts.
- Queue imports/synchronisation, inspect progress/failures and retry through the owner workflow.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/frappe` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
