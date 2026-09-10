# UIUX Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

UIUX is the independent browser workspace for discovering and verifying the shared CODEXSUN design
system. It owns the UIUX Gallery website and consumes shared UI through public exports.

## Ownership

- `apps/uiux/web` owns the gallery pages, catalogs, previews, specimens, examples,
  code samples, routes, navigation, environment, and browser state.
- `packages/ui` owns reusable primitives, components, forms, blocks, layouts, templates,
  variants, hooks, contracts, tokens, and theme assets.
- The gallery consumes public `@codexsun/ui` exports. It must not recreate shared UI.
- Other applications must not import UIUX source or depend on `@codexsun/uiux-web`.
- UIUX does not own business routes, persistence, or an API service.

## Workspaces and commands

| Workspace            | Purpose                         | Development command    | Default address         |
| -------------------- | ------------------------------- | ---------------------- | ----------------------- |
| `@codexsun/uiux-web` | UIUX documentation and previews | `npm.cmd run dev:uiux` | `http://127.0.0.1:6130` |

Use `npm.cmd run build --workspace @codexsun/uiux-web` and
`npm.cmd run typecheck --workspace @codexsun/uiux-web` for focused validation.

## Runtime configuration

- `UIUX_WEB_HOST` defaults to `127.0.0.1`.
- `UIUX_WEB_PORT` defaults to `6130`.
- Root preflight builds `@codexsun/ui`, reserves the port, and starts Vite in strict-port mode.
- Runtime output is captured below `storage/app/private/runtime` when preflight owns the process.

## Health and shutdown

The static web liveness URL is `GET /`. UIUX has no dependency readiness probe because it owns no
API or database connection. Root preflight forwards shutdown to Vite and releases its process
marker for `SIGINT`, `SIGTERM`, and supervisor IPC.

## Verification

- Type-check and build both `@codexsun/ui` and `@codexsun/uiux-web`.
- Run UI boundary, module documentation, application documentation, and runtime catalog checks.
- Start `npm.cmd run dev:uiux`, open the root URL, and verify navigation and the application title.
- Confirm production chunks remain within the 400 KB budget without warnings.

## Module catalog

See the [UIUX module catalog](../../assist/modules/uiux.md) and the
[Gallery module README](web/src/modules/gallery/README.md).
