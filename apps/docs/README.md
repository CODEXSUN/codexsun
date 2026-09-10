# Docs Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Docs is a connected documentation application. It indexes repository Markdown,
MDX, and text files, includes its Obsidian-compatible vault, and maintains a
MariaDB metadata index.

## Ownership

- `api` owns repository document discovery, safe MDX rendering, metadata indexing, health, and API startup.
- `web` owns the documentation browser and reading experience.
- `contracts` owns public HTTP response contracts shared by Docs workspaces.
- `content` is the application-owned source vault.
- `packages/ui` owns every reusable component, form frame, field control, block,
  layout, template, and visual variant. Docs uses public `@codexsun/ui` exports.
- Docs must not create reusable UI copies. It owns document data, validation,
  callbacks, routes, workflows, and screen composition.

The web workspace supplies Docs navigation and content to the shared
`@codexsun/ui/layouts/documentation-workspace` frame. It does not maintain a second application
header or sidebar shell. The layout delegates to MDI Main and applies documentation-specific
identity, search, sidebar persistence, status, and workspace defaults.

## Workspaces and commands

| Workspace                  | Purpose               | Development command        | Default address         |
| -------------------------- | --------------------- | -------------------------- | ----------------------- |
| `@codexsun/docs-api`       | Docs API and renderer | `npm.cmd run dev:docs-api` | `http://127.0.0.1:6030` |
| `@codexsun/docs-web`       | Docs browser          | `npm.cmd run dev:docs`     | `http://127.0.0.1:6040` |
| `@codexsun/docs-contracts` | Public HTTP contracts | Root build and type check  | N/A                     |

`npm.cmd run dev:docs` starts the API and web stack together.

## Deployment assembly

The shared runtime holder registers `docs-api` and `docs-web`. The Docs application requires Platform and is selected in the complete `development` profile. Customer profiles can omit Docs; omitted Docs workspaces and artifacts do not enter the generated component stages.

The API and web components keep their own process, port, health, and output boundaries. Deployment selection does not transfer Docs vault, index, or rendering ownership to Platform.

## Runtime configuration

Root `.env` owns `DOCS_API_HOST`, `DOCS_API_PORT`, `DOCS_WEB_PORT`, `VITE_DOCS_API_URL`, `DOCS_VAULT_PATH`, and `DOCS_INDEX_MODE`. The index mode is `filesystem`, `database`, or `hybrid`; the default is `hybrid`.

The API uses the shared Platform Core observability adapter for Pino logs, request correlation, HTTP telemetry, and safe shutdown. Production JSON output is captured by the runtime holder for Orship.

The default vault is `apps/docs/content`. The API also discovers Markdown, MDX, and text
files below the repository root, excluding generated, dependency, storage, and Git directories.
Executable MDX expressions and imports are rejected before server rendering. Docs Settings provides
a read-only health scan for missing owned README files and unorganized document sources.

## Health and shutdown

The local API health endpoint is `GET http://127.0.0.1:6030/health`. Start and stop the local stack through the root preflight supervisor. Any missing production readiness or graceful-shutdown behavior must be completed before Docs is treated as a production server.

## Verification

Run the root type check, build, lint, formatting, application-documentation, and module-documentation gates. Exercise the health endpoint and rendered-document route after runtime changes. Docs does not yet have its own production-artifact lifecycle E2E test; treat that path as unverified until one is added.

## Module catalog

The Docs catalog is [assist/modules/docs.md](../../assist/modules/docs.md). The authoritative module documents are the [API module README](api/src/modules/docs-library/README.md) and [web module README](web/src/modules/docs-library/README.md).
