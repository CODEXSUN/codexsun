# UI Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

UI is the independent browser workspace for discovering and verifying the shared CODEXSUN design
system. It owns the live showcase website and renders the shared package through public exports.

## Ownership

- `apps/ui/web` owns the runnable shell, gallery routes, documentation pages, catalogs, previews,
  specimens, example data, navigation wiring, environment, and browser state.
- `packages/ui` owns reusable primitives, blocks, application layouts, generic templates, hooks,
  design-system contracts, tokens, and theme assets.
- UI does not own business routes, persistence, an API service, or copies of shared components.

## Workspaces and commands

| Workspace          | Purpose                       | Development command  | Default address         |
| ------------------ | ----------------------------- | -------------------- | ----------------------- |
| `@codexsun/ui-web` | UI documentation and previews | `npm.cmd run dev:ui` | `http://127.0.0.1:6130` |

Use `npm.cmd run build --workspace @codexsun/ui-web` and
`npm.cmd run typecheck --workspace @codexsun/ui-web` for focused validation.

## Runtime configuration

- `UI_WEB_HOST` defaults to `127.0.0.1`.
- `UI_WEB_PORT` defaults to `6130`.
- Root preflight builds `@codexsun/ui`, reserves the port, and starts Vite in strict-port mode.
- Runtime output is captured below `storage/app/private/runtime` when preflight owns the process.

## Health and shutdown

The static web liveness URL is `GET /`. UI has no dependency readiness probe because it owns no
API or database connection. Root preflight forwards shutdown to Vite and releases its process
marker for `SIGINT`, `SIGTERM`, and supervisor IPC.

## Verification

- Type-check and build both `@codexsun/ui` and `@codexsun/ui-web`.
- Run UI boundary, module documentation, application documentation, and runtime catalog checks.
- Start `npm.cmd run dev:ui`, open the root URL, and verify navigation and the application title.
- Confirm production chunks remain within the 400 KB budget without warnings.

## Module catalog

See the [UI module catalog](../../assist/modules/ui.md) and the
[Gallery module README](web/src/modules/gallery/README.md).
