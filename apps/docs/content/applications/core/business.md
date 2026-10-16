# Core: core business and ownership

Persisted organisation, contact, product and common reference masters.

## Ownership boundary

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

## Inputs and outputs

- Maintain common geography, units, taxes, product categories, brands and other references.
- Create organisation/company and financial-year records, then select default company/year.
- Maintain contacts and products with persisted parent IDs.
- Other apps consume public lookups; Core validates parents, duplicate policy and lifecycle dependencies.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/core` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
