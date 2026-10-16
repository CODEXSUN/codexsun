# Accounts: core business and ownership

Accounting views and ledger/journal foundation.

## Ownership boundary

Accounting leaves own their contract; do not infer full automatic financial posting from an overview or composed screen.

## Inputs and outputs

- Select a company and financial year.
- Open the accounting overview and inspect available account/ledger/journal screens.
- Follow the module APIs for persisted records and confirm which capabilities are complete before extending posting behavior.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/accounts` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
