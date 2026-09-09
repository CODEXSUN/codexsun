# Docs Library API Module

## Purpose

Reads the Docs vault, converts restricted MDX to server-rendered HTML, and
synchronizes document metadata to MariaDB.

## Identity and version

- Module ID: `docs.library.api`
- Version: `0.1.1`
- Scope: `docs`
- Status: `active`

## Ownership

- Entities and records: repository document and `docs_documents` index record.
- Tables and storage paths: `docs_documents`; `apps/docs/content` is the default vault.
- Routes: `GET /api/docs/v1/documents`, `GET /api/docs/v1/documents/:slug`, `PUT /api/docs/v1/documents/:slug`, and `POST /api/docs/v1/index/sync`.
- Editing: updates keep Markdown/MDX source under its existing owner path, preserve existing front matter, update an optional title, and require the loaded source hash to prevent stale edits from overwriting newer content.
- Link behavior: Obsidian wiki-links are rendered as hash deep-links for the Docs browser. Executable MDX remains rejected, while fenced and inline code are treated as documentation.
- Permissions and settings: no authentication is implemented yet; `DOCS_INDEX_MODE` and `DOCS_VAULT_PATH` control runtime behavior.

## Public contracts

- API: `@codexsun/docs-contracts` validates list, document, update, and sync request/response shapes.
- Events published and consumed: none.
- Dependencies: no module dependencies in version `0.1.1`.

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
