# Projex

Projex is the authenticated repository control plane for CODEXSUN apps and devkits.

## Scope

Projex gives one view of registered projects, API and web hosts, local stages, running ports, and working documentation. It reads repository metadata and does not mutate another app.

## Hosts

| Host | Port | Command | Health |
| --- | ---: | --- | --- |
| Projex API | 6360 | `npm.cmd run dev:projex-api` | `http://127.0.0.1:6360/api/v1/projex/health` |
| Projex web | 6361 | `npm.cmd run dev:projex-web` | `http://127.0.0.1:6361` |

## Authenticated layers

The API uses the shared local identity store and SQLite at `storage/apps/projex/private/data/projex_db.sqlite`. The generated identity routes protect the workspace route. Super-admin and admin sessions keep their identity and privileged desks. A user session opens the Projex dashboard.

## Dashboard

- Overview shows project, host, and documentation counts.
- Projects lists every registry application and its provider ownership.
- Runtime shows API and web ports with `registered`, `configured`, or `running` stages.
- Documentation indexes Assist files and owner README or agent documents.
- Add-ons catalogs every registered business capability from `core/registry/addons` with purpose, ownership, package, provider, dependencies, contracts, events, enablement, and lifecycle details.
- The Tweak panel switches between compact and relaxed density and card or flush surfaces.

The add-on catalog is served by `GET /api/v1/projex/addons`. Projex reads registry metadata only; add-on packages remain independently owned under `packages/addons/<id>`.

## Local setup

1. Keep `devkits/projex/api/.app.env` and `devkits/projex/web/.app.env` local.
2. Start the API host.
3. Start the web host.
4. Sign in with a local identity seed.

For local development, `AUTO_LOGIN=1` enables the configured `AUTO_LOGIN_DESK` seed through the development-login route. Keep `REFRESH_IDENTITY_SEED=0` during normal runs. Set it to `1` only for a deliberate seed refresh after changing local identity values, then set it back to `0`.

Run dependency installation only from the repository root. The app never owns a `node_modules`, `dist`, or `.turbo` directory.

## Verification

```powershell
npm.cmd run check --workspace @codexsun/projex-api
npm.cmd run check --workspace @codexsun/projex-web
npm.cmd run test --workspace @codexsun/projex-api
node tools/check-app-architecture.mjs
node tools/check-module-boundaries.mjs
```
