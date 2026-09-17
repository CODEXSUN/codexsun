# Docs Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Docs is a connected documentation application. It indexes repository Markdown,
MDX, and text files, includes its Obsidian-compatible vault, and maintains a
MariaDB metadata index.

## Ownership

- `api` owns repository document discovery, safe MDX rendering, metadata indexing, health, and API startup.
- `web` owns the documentation browser and reading experience.
- `packages/docs-contracts` owns public HTTP response contracts shared by Docs workspaces.
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

| Workspace                  | Purpose               | Development command                     | Component port key |
| -------------------------- | --------------------- | --------------------------------------- | ------------------ |
| `@codexsun/docs-api`       | Docs API and renderer | `npm.cmd run dev:component -- docs-api` | `API_PORT`         |
| `@codexsun/docs-web`       | Docs browser          | `npm.cmd run dev:stack -- docs`         | `WEB_PORT`         |
| `@codexsun/docs-contracts` | Public HTTP contracts | Root build and type check               | N/A                |

`npm.cmd run dev:stack -- docs` starts the API and web stack together.

## Deployment assembly

The shared runtime holder registers `docs-api` and `docs-web`. The Docs application requires Platform and is selected in the complete `development` profile. Customer profiles can omit Docs; omitted Docs workspaces and artifacts do not enter the generated component stages.

The API and web components keep their own process, port, health, and output boundaries. Deployment selection does not transfer Docs vault, index, or rendering ownership to Platform.

## Provider composition

The Docs API composition root creates `DocsMariaDbDatabaseProvider` from its
database configuration. It injects `DatabaseProvider<Kysely<DocsDatabase>>`
into Docs Library. The provider owns pool lifecycle and readiness; Docs Library
owns the `docs_documents` schema, migration, repository, and indexing behavior.
See the [Provider adoption record](../../assist/records/docs/2026-09-16-library-provider-adoption.md).

## Runtime configuration

The Docs API and web components own isolated `.app.env` files. The API file
defines `API_HOST`, `API_PORT`, database access, vault settings, and index mode.
The web file defines `WEB_HOST` and `WEB_PORT`. The selected runtime plan
supplies `VITE_DOCS_API_URL`. The index mode is `filesystem`, `database`, or
`hybrid`; the default is `hybrid`.

The API uses the shared Platform Core observability adapter for Pino logs, request correlation, HTTP telemetry, and safe shutdown. Production JSON output is captured by the runtime holder for Orship.

The default vault is `apps/docs/content`. The API also discovers Markdown, MDX, and text
files below the repository root, excluding generated, dependency, storage, and Git directories.
Executable MDX expressions and imports are rejected before server rendering. Docs Settings provides
a read-only health scan for missing owned README files and unorganized document sources.

## Health and shutdown

The local API health endpoint is `GET /health` on the Docs API component `API_PORT`. Start and stop the local stack through the root preflight supervisor. Any missing production readiness or graceful-shutdown behavior must be completed before Docs is treated as a production server.

## Verification

Run the root type check, build, lint, formatting, application-documentation, and module-documentation gates. Exercise the health endpoint and rendered-document route after runtime changes. Docs does not yet have its own production-artifact lifecycle E2E test; treat that path as unverified until one is added.

## Module catalog

The Docs catalog is [assist/modules/docs.md](../../assist/modules/docs.md). The authoritative module documents are the [API module README](api/src/modules/docs-library/README.md) and [web module README](web/src/modules/docs-library/README.md).
