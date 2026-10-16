# QCafe in the CODEXSUN workspace

QCafe has separate web and desktop entry points. Platform opens the web app at `/app/qcafe` using its existing tenant session. Web users do not enter a cashier PIN. Desktop retains the existing PIN login, local SQLite API, Tauri host, and printing flow.

The current web milestone covers menu management, saved parallel dine-in and takeaway orders, tables and seats, kitchen tickets, immutable bills, partial and full payments, bill history, and browser printing. Web records live in tenant MariaDB tables. Bookings, inventory, configurable tax, discounts, reversals, and desktop synchronization remain follow-up work.

## Local development

Set these values in the root `.env` (the root `.env.example` documents them):

```dotenv
CODEXSUN_TENANCY_MODE=single
CODEXSUN_QCAFE_API_PORT=4180
CODEXSUN_QCAFE_WEB_PORT=5180
CODEXSUN_QCAFE_DATABASE_PATH=apps/qcafe/.local/q-cafe.sqlite
CODEXSUN_QCAFE_IMAGE_DIRECTORY=apps/qcafe/.local/images
```

Run `npm run dev` from the repository root. Open **Q Cafe** from the Platform launcher, or open `/app/qcafe` after Platform sign-in. Platform directly composes the QCafe web export. The web app no longer depends on an iframe or separate QCafe frontend server. Browser requests use `/api/app/qcafe/menu`, `/api/app/qcafe/pos`, and the payment subresource. Desktop requests use the local API at `/api/v1/qcafe`. `npm run dev:qcafe:api` and `npm run dev:qcafe:web` remain local development tools.

The Q Cafe API's internal operator token is generated when its local service starts. PIN sign-in and staff permission checks remain in the Q Cafe API. Existing `.local/` data is preserved. Do not remove the SQLite file or use a bootstrap PIN against an existing restaurant database.

## Build and checks

`npm run build:qcafe` builds the browser frontend into `dist/apps/qcafe/web`; `npm run build:qcafe:desktop` builds the Tauri asset variant with a root base path. The Windows build commands are in the [desktop README](desktop/README.md). Q Cafe's own release version remains in `version.json`; the three npm workspace package versions follow the root CODEXSUN version. Run `npm test -w @codexsun/qcafe-api` for API tests and `npm run typecheck -w @codexsun/qcafe-web` for frontend types.

## Deployment boundary

The Platform adapter resolves its authenticated tenant, checks active `qcafe` activation, and injects the tenant MariaDB connection. Every menu and POS operation checks a live Platform permission. Menu owns `qcafe_menu` and its activity. POS owns `qcafe_pos`, its immutable lines, payment ledger, and activity. Each public record uses an eight-character UUID. The tenant database provides isolation without redundant tenant columns.

Provisioning includes the QCafe migration batch in `migration_schema`. Permission seeding runs only for enabled QCafe tenants and grants initial access to the tenant admin role. Existing inactive permissions and role mappings stay inactive. Other staff roles require explicit Platform permission assignments. No default cashier or owner accounts are created by web sign-in.

The standalone desktop API still uses SQLite. Do not share that local database between tenants. Desktop enrollment and offline synchronization remain deferred until the web app is complete.

## Rename compatibility

The source folder, workspace packages, routes, scripts, and app activation key now use `qcafe`. Root environment keys use `CODEXSUN_QCAFE_*`. Update deployed environments and external links before restarting. Existing Platform app registry, plan access, entitlement, and tenant module records containing `q-cafe` require a coordinated data migration to `qcafe`. This source rename does not modify live databases or grant app access.

Existing SQLite filenames remain `q-cafe.sqlite`. Historical cloud SQLite files under `STORAGE_ROOT/q-cafe/<tenant UUID>` are preserved but are no longer read by the web API. This release does not import them into MariaDB. Review and migrate each tenant dataset explicitly before replacing an existing restaurant deployment. The desktop identifier remains `in.codexsun.qcafe`. Historical changelog entries retain their original paths.

## Web verification

Run `npm run test:web -w @codexsun/qcafe-api` for pure POS tests. Run `npm run test:web:database -w @codexsun/qcafe-api` for MariaDB verification. The database test creates and removes two uniquely named `codexsun_dev_qcafe_test_*` databases. It requires database creation permission and never resets an existing tenant database. Use `npm run typecheck -w @codexsun/qcafe-api` and the existing web checks before release. Desktop regression tests remain `npm test -w @codexsun/qcafe-api`.

## Component documentation

Restaurant operations with a local API, POS web application, and Tauri Windows packaging.

Keep local operational data and operator credentials outside disposable build folders. Preserve PIN roles, stock and booking constraints, bill settlement, backups, and print-service boundaries.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `desktop/`: `service`, `src-tauri`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `npm run typecheck -w @codexsun/qcafe-web`
- `npm run build -w @codexsun/qcafe-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/qcafe-api`.
- `desktop`: `@codexsun/qcafe-desktop`.
- `web`: `@codexsun/qcafe-web`.

### Declared internal dependencies

- `@codexsun/ui`

QCafe web renders inside Platform's shared tenant workspace, following the CRM composition pattern. Platform owns the shell and route navigation; QCafe owns POS and menu workflows. The sidebar opens POS at `/app/qcafe` and Master at `/app/qcafe/menu`.

### Desktop-style web POS

The web POS uses the desktop visual arrangement: category pills, compact image cards, a 440px bill panel, line quantity buttons, a blue total, last-bill status, and bottom item-code entry. F2 focuses search, F3 focuses item code, and F7 saves the bill and opens collection. Existing request IDs protect interrupted bill retries. Menu items accept an optional HTTPS photo URL stored in tenant MariaDB by migration `qcafe.menu.002`; missing or failed photos show an empty-image state.

Web supports saved parallel orders, POS/KOT dine-in assignment, takeaway, table and seat configuration, incremental kitchen tickets, cancellation tickets, bill creation, settlement, and browser printing. The top bar provides search (F2), order tabs, New Order (F9), Kitchen (F4), and Save & print (F8). F1 cycles POS → KOT → Take Away → POS; F7 opens bill collection. The separate pages use `/app/qcafe`, `/app/qcafe/kot`, and `/app/qcafe/take-away`. The new KOT and Take Away pages currently use the existing POS layout and order workflow; page-specific behavior will be refined separately. Kitchen opens the saved KOT preview with Print KOT; reprinting uses the existing snapshot.

Orders are saved to tenant MariaDB after each edit. Revision checks reject stale edits. Unique seat claims prevent overlapping assignments and remain held until payment completes or an order is cancelled. After sending a KOT, its quantities cannot be reduced or reassigned; cancellation issues a retained cancellation ticket. New kitchen sends include only additional quantities. Retrying an uncertain operation keeps its original request ID and locks further editing until confirmed. Bill creation and order finalization commit in one transaction.

Migrations `qcafe.table.001`, `qcafe.order.001`, and `qcafe.pos.002` add tables, order/seat/ticket/operation records, and nullable bill service context. Existing bills and desktop SQLite records are unchanged. Tables are deactivated instead of deleted to preserve historical references. `qcafe.table.manage` controls table maintenance; `qcafe.kitchen.send` controls KOT and order cancellation. Existing POS view/create/pay permissions remain enforced.

Web uses browser print dialogs. Silent Windows printer routing and the desktop mixed-payment collector remain separate desktop features. Physical receipt/KOT printer output has not been verified.

The POS header keeps search, order tabs, New Order, and Save & print. Refresh, Tables, and Kitchen are hidden on POS. New orders retain the original immediate parcel draft flow; table/seat assignment remains on the order control.

### Master workspace

The sidebar label is Master with a crossed-utensils icon. `/app/qcafe/menu` remains the stable route. Items uses a searchable record list and an inline view/edit form. Save item stays at the top of the editor. The form supports item category, code, name, rupee price, photo URL, and status. Item deactivation hides it from new orders without deleting historical bills.

Categories displays the groups already stored with menu items. New categories are entered in the item form. Restaurant Tables uses the same split layout for name, seat count, and active/inactive status. Each business module retains its existing Platform permissions and tenant MariaDB persistence. File upload and special-price configuration are not part of this layout change.
