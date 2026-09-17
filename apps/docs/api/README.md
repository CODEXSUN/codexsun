# Docs API

## Purpose

Docs API publishes documentation contracts and Docs provider health.

## Owner

The Docs API owns the `docs.catalog` module provider.

## Configuration

Set `PLATFORM_HOST`, `DOCS_API_PORT`, `DOCS_DATABASE_URL`, `DOCS_INDEX_PATH`, and `DOCS_WEB_ORIGIN`.

## Data

SQLite will store the derived Docs index. D-1220 owns the schema and sync work.

## Verification

Run `npm.cmd run test:docs-api` and `npm.cmd run check --workspace @codexsun/docs-api`.
