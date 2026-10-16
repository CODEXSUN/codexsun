# Q Cafe: core business and ownership

Restaurant/POS operations with its own PIN login and desktop delivery.

## Ownership boundary

Q Cafe has its own runtime, login and deployment contract. Do not reuse its PIN identity as Platform tenant authentication.

## Inputs and outputs

- Run the supported single-tenant Q Cafe deployment and activate its licence.
- Sign in using its separate PIN-based login.
- Configure restaurant masters/tables and available POS/catalog settings.
- Use the POS billing, payment collection and receipt/Z-report flows documented by the owner README.
- Package desktop resources and validate printer/receipt behavior on the target device.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/qcafe` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
