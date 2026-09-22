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

## Docker Deployment

Q Cafe has a Windows-first Docker deployment in `.container/`. It builds the
API and web hosts from the current repository, runs the append-only migration
and identity preparation command, starts the API in production verification
mode, and serves the web application through Nginx.

The container deployment reads shared values from the ignored repository
`.env` and identity values from `api/.app.env`. It overrides `DB_DRIVER` with
`sqlite` and stores the application database, identity database, and private
files in the `qcafe-data` Docker volume. It does not copy environment files
into either image.

Run these commands from a POSIX shell at the repository root:

```sh
sh apps/qcafe/.container/qcafe-setup.sh
sh apps/qcafe/.container/qcafe-update.sh
sh apps/qcafe/.container/qcafe-verify.sh
sh apps/qcafe/.container/qcafe-backup.sh
```

`qcafe-update.sh` stops database writers, creates a backup in the
`qcafe-backups` volume, builds the current source, applies serial migrations,
and recreates the services. Pass `--no-cache` for a clean image build.

Data removal is intentionally guarded. Use an interactive terminal and type
the requested phrase, or set `QCAFE_CONFIRM_DROP=yes` for an explicitly
authorized non-interactive drop:

```sh
sh apps/qcafe/.container/qcafe-drop.sh
```

The default endpoints are `http://127.0.0.1:6221` for the web application and
`http://127.0.0.1:6220/api/v1/qcafe/health` for API health. Override published
ports with `QCAFE_WEB_PUBLISHED_PORT` and `QCAFE_API_PUBLISHED_PORT`.
