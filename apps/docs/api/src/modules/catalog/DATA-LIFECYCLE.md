# Docs Catalog Data Lifecycle

## Data Role

Docs uses SQLite for a derived index. Repository Markdown and MDX files remain
the source authority.

## Current State

D-1220 creates `docs-index.001`, `docs_migrations`, and `docs_documents`.
The index stores source metadata and document content. It has no seed data.

## Planned Lifecycle

A full sync deletes stale index records and rebuilds changed records from
allowed source paths. The index enables foreign keys, WAL mode, and a
five-second busy timeout.

## Retention And Recovery

The index can be rebuilt from source documents. Keep backups only when a
deployment profile defines them. Do not treat the index as the only copy of a document.
