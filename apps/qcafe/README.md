# Q Cafe

Q Cafe is the restaurant application in CODEXSUN.

The application target is a complete restaurant POS, KOT, and booking system.
It owns restaurant product modules, workflow composition, and application routes.

## Product Scope

1. POS sales for dine-in, takeaway, delivery, and counter service.
2. Table management with floor layout, table state, and split or merge bills.
3. KOT management for kitchen order tickets and preparation status.
4. Menu, category, modifier, recipe, and price management.
5. Booking and reservation management for tables and events.
6. Customer, loyalty, offer, and payment workflows.
7. Shift, cash drawer, settlement, refund, and audit workflows.
8. Inventory touchpoints for item availability and recipe stock use.
9. Restaurant reports for sales, taxes, staff, tables, and kitchen time.
10. Role-based access for cashier, waiter, kitchen, manager, and owner users.

## Architecture

Q Cafe keeps product behavior inside `apps/qcafe`.

The API host exposes typed routes and application-owned modules.
The web host composes the shared CODEXSUN MDI workspace.
Shared UI, identity, storage, and platform features must come from public
package contracts.

Kysely is the primary typed SQL layer for Q Cafe application data. The same
module repositories target local SQLite and cloud MariaDB through platform
data providers. The repository `DB_DRIVER` setting selects `sqlite` or
`mariadb`; synchronization remains a separate application workflow.

## Current State

The API host has a Foundation Setup module for businesses, locations,
business days, service channels, and document number sequences.
The Menu module owns categories, items, variants, price books, and effective
pricing. The Settings module exposes database lifecycle health, a persisted
cloud-sync policy, and safe connector metadata with deployment secret
references.

The web host exposes Overview first, then Foundation and Cafe navigation. Its
fixed Settings entry opens dedicated Database, Cloud sync, and Connectors
pages wired to authenticated API contracts.
