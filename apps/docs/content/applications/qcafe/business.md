# Q Cafe: core business and ownership

Restaurant POS with Platform identity and MariaDB for web, and PIN login with SQLite for desktop.

## Ownership boundary

QCafe owns menu prices, bills, payment settlement, and their audit records. Platform owns tenant identity, activation, and permissions. Desktop PINs do not grant cloud access.

## Inputs and outputs

- Open web QCafe through the authenticated Platform launcher.
- Maintain tenant menu prices and activation status.
- Create takeaway bills and collect partial or full payments with duplicate-request protection.
- Print saved bills and receipts. Preserve immutable financial history.
- Keep desktop login, SQLite, licensing, and native printing separate until desktop work resumes.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/qcafe` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
