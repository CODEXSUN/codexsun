# Garments Library API Module

## Purpose

Reads the Garments vault, converts restricted MDX to server-rendered HTML, and
synchronizes document metadata to MariaDB.

## Identity and version

- Module ID: `garments.library.api`
- Version: `0.1.2`
- Scope: `garments`
- Status: `active`

## Ownership

- Entities and records: repository document and `garments_documents` index record.
- Tables and storage paths: `garments_documents`; `apps/garments/content` is the default vault.
- Routes: `GET /api/garments/v1/assets/:path`, `GET /api/garments/v1/documents`, `GET /api/garments/v1/documents/:slug`, `GET /api/garments/v1/scan`, `PUT /api/garments/v1/documents/:slug`, and `POST /api/garments/v1/index/sync`.
- Editing: updates keep Markdown/MDX source under its existing owner path, preserve existing front matter, update an optional title, and require the loaded source hash to prevent stale edits from overwriting newer content.
- Document behavior: Markdown, MDX, and plain-text sources are discovered dynamically. Obsidian wiki-links render as hash deep-links. GitHub-Flavored Markdown renders tables. Fenced code receives server-side language highlighting. Mermaid fences remain source code for the web reader to render safely.
- Documentation health: the scan is read-only. It reports owned application, package, and module folders without a `README.md`, plus Markdown, MDX, and text sources that live outside the recognized repository documentation roots.
- Article assets: the route serves only supported image files inside the repository. It rejects unsafe paths and non-image extensions.
- Permissions and settings: no authentication is implemented yet; `GARMENTS_INDEX_MODE` and `GARMENTS_VAULT_PATH` control runtime behavior.

## Public contracts

- API: `@codexsun/garments-contracts` validates list, document, update, and sync request/response shapes.
- Events published and consumed: none.
- Dependencies: no module dependencies in version `0.1.2`.

## Lifecycle

- Install: sync creates the additive index table.
- Activate: registers validated Garments routes.
- Upgrade: scans repository Markdown and MDX files while excluding generated and dependency directories.
- Deactivate and uninstall: do not delete vault or index records automatically.

## Persistence and verification

- Migration: `garments-library.migration.ts` creates `garments_documents` if absent.
- Seeds: source files are the repeatable seed input; sync writes their metadata.
- Database verification needs a running configured MariaDB instance.
- Required provider: `DatabaseProvider<Kysely<GarmentsDatabase>>` `1.0.0`. The
  application composition root owns connection lifecycle and readiness; this
  module owns its typed schema, migration, repository, and indexing workflow.

## Development records

Future changes must be recorded in the [Garments development records](../../../../../../assist/records/garments/README.md).
