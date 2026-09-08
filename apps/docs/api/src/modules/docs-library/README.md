# Docs Library API Module

## Purpose

Reads the Docs vault, converts restricted MDX to server-rendered HTML, and
synchronizes document metadata to MariaDB.

## Identity and version

- Module ID: `docs.library.api`
- Version: `0.1.0`
- Scope: `docs`
- Status: `active`

## Ownership

- Entities and records: vault document and `docs_documents` index record.
- Tables and storage paths: `docs_documents`; `apps/docs/content` by default.
- Routes: `GET /api/docs/v1/documents`, `GET /api/docs/v1/documents/:slug`, and `POST /api/docs/v1/index/sync`.
- Link behavior: Obsidian wiki-links are rendered as hash deep-links for the Docs browser; executable MDX remains rejected.
- Permissions and settings: no authentication is implemented yet; `DOCS_INDEX_MODE` and `DOCS_VAULT_PATH` control runtime behavior.

## Public contracts

- API: `@codexsun/docs-contracts` validates list, document, and sync responses.
- Events published and consumed: none.
- Dependencies: no module dependencies in version `0.1.0`.

## Lifecycle

- Install: sync creates the additive index table.
- Activate: registers validated Docs routes.
- Upgrade: the migration is additive and repeatable.
- Deactivate and uninstall: do not delete vault or index records automatically.

## Persistence and verification

- Migration: `docs-library.migration.ts` creates `docs_documents` if absent.
- Seeds: source files are the repeatable seed input; sync writes their metadata.
- Database verification needs a running configured MariaDB instance.

## Development records

Future changes must be recorded in the [Docs development records](../../../../../../assist/records/docs/README.md).
