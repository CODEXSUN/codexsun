# Q Cafe in the CODEXSUN workspace

Q Cafe keeps its React frontend, SQLite API, PIN sign-in, and Tauri desktop source. The CODEXSUN Platform registers it as a tenant app and opens its frontend at `/app/qcafe`. The tenant must sign in to Platform to use the launcher. Q Cafe then asks for its own cashier PIN or username. Platform authentication does not replace Q Cafe's staff roles or PIN checks.

## Local development

Set these values in the root `.env` (the root `.env.example` documents them):

```dotenv
CODEXSUN_TENANCY_MODE=single
CODEXSUN_QCAFE_API_PORT=4180
CODEXSUN_QCAFE_WEB_PORT=5180
CODEXSUN_QCAFE_DATABASE_PATH=apps/qcafe/.local/q-cafe.sqlite
CODEXSUN_QCAFE_IMAGE_DIRECTORY=apps/qcafe/.local/images
```

Run `npm run dev` from the repository root. Open **Q Cafe** from the Platform launcher, or open `/app/qcafe` after Platform sign-in. Platform forwards `/qcafe/` to the Q Cafe frontend. Browser requests use `/api/app/qcafe` and the Platform-owned adapter. Desktop requests use the local API at `/api/v1/qcafe`. `npm run dev:qcafe:api` and `npm run dev:qcafe:web` start the local services separately.

The Q Cafe API's internal operator token is generated when its local service starts. PIN sign-in and staff permission checks remain in the Q Cafe API. Existing `.local/` data is preserved. Do not remove the SQLite file or use a bootstrap PIN against an existing restaurant database.

## Build and checks

`npm run build:qcafe` builds the browser frontend into `dist/apps/qcafe/web`; `npm run build:qcafe:desktop` builds the Tauri asset variant with a root base path. The Windows build commands are in the [desktop README](desktop/README.md). Q Cafe's own release version remains in `version.json`; the three npm workspace package versions follow the root CODEXSUN version. Run `npm test -w @codexsun/qcafe-api` for API tests and `npm run typecheck -w @codexsun/qcafe-web` for frontend types.

## Deployment boundary

The Platform adapter resolves the authenticated tenant and checks its active `qcafe` module setting. It uses a separate SQLite store for each tenant. Staff PIN sessions remain scoped to that tenant. The standalone desktop API uses one SQLite database. The development supervisor starts this local API only with `CODEXSUN_TENANCY_MODE=single`. Do not share the standalone database between tenants.

## Rename compatibility

The source folder, workspace packages, routes, scripts, and app activation key now use `qcafe`. Root environment keys use `CODEXSUN_QCAFE_*`. Update deployed environments and external links before restarting. Existing Platform app registry, plan access, entitlement, and tenant module records containing `q-cafe` require a coordinated data migration to `qcafe`. This source rename does not modify live databases or grant app access.

Existing SQLite filenames remain `q-cafe.sqlite`. Platform tenant storage remains under `STORAGE_ROOT/q-cafe/<tenant UUID>`. The desktop application identifier remains `in.codexsun.qcafe`. These persisted identities preserve existing data. The folder move also preserves local `.local/` files. Historical changelog entries retain their original paths.
