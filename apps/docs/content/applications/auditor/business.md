# Auditor: core business and ownership

Client portal access and audit-oriented client workspace.

## Ownership boundary

Auditor owns client portal/credential fields. Its overview does not imply a complete statutory audit platform.

## Inputs and outputs

- Register/update a client and inspect its owner details.
- Configure encrypted portal credentials using permitted management actions.
- Reveal/use credential fields only with the distinct permission.
- Review record activity; extend client audit workflows in the Auditor owner.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/auditor` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
