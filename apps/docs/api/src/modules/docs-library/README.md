# Docs Library API Module

## Purpose

Reads the Docs vault, converts restricted MDX to server-rendered HTML, and
synchronizes document metadata to MariaDB.

## Identity and version

- Module ID: `docs.library.api`
- Version: `0.1.2`
- Scope: `docs`
- Status: `active`

## Ownership

- Entities and records: repository document and `docs_documents` index record.
- Tables and storage paths: `docs_documents`; `apps/docs/content` is the default vault.
- Routes: `GET /api/docs/v1/assets/:path`, `GET /api/docs/v1/documents`, `GET /api/docs/v1/documents/:slug`, `GET /api/docs/v1/scan`, `PUT /api/docs/v1/documents/:slug`, and `POST /api/docs/v1/index/sync`.
- Editing: updates keep Markdown/MDX source under its existing owner path, preserve existing front matter, update an optional title, and require the loaded source hash to prevent stale edits from overwriting newer content.
- Document behavior: Markdown, MDX, and plain-text sources are discovered dynamically. Obsidian wiki-links render as hash deep-links. GitHub-Flavored Markdown renders tables. Fenced code receives server-side language highlighting. Mermaid fences remain source code for the web reader to render safely.
- Documentation health: the scan is read-only. It reports owned application, package, and module folders without a `README.md`, plus Markdown, MDX, and text sources that live outside the recognized repository documentation roots.
- Article assets: the route serves only supported image files inside the repository. It rejects unsafe paths and non-image extensions.
- Permissions and settings: no authentication is implemented yet; `DOCS_INDEX_MODE` and `DOCS_VAULT_PATH` control runtime behavior.

## Public contracts

- API: `@codexsun/docs-contracts` validates list, document, update, and sync request/response shapes.
- Events published and consumed: none.
- Dependencies: no module dependencies in version `0.1.2`.

## Lifecycle

- Install: sync creates the additive index table.
- Activate: registers validated Docs routes.
- Upgrade: scans repository Markdown and MDX files while excluding generated and dependency directories.
- Deactivate and uninstall: do not delete vault or index records automatically.

## Persistence and verification

- Migration: `docs-library.migration.ts` creates `docs_documents` if absent.
- Seeds: source files are the repeatable seed input; sync writes their metadata.
- Database verification needs a running configured MariaDB instance.

## Development records

Future changes must be recorded in the [Docs development records](../../../../../../assist/records/docs/README.md).
