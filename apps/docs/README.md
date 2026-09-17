# Docs

## Purpose

Docs is the global CODEXSUN documentation application.

It will index repository Markdown and MDX files in place. It will show links,
backlinks, and graph metadata without changing source authority.

## Owner

Docs owns this application and its `docs.catalog` API provider.

## Interfaces

The Docs API publishes browser-safe contracts through `@codexsun/docs-contracts`.

## Configuration

Docs reads root defaults and host overrides from `api/.app.env` and `web/.app.env`.

## Verification

Run `npm.cmd run test:docs-api` and `npm.cmd run test:docs-web`.
