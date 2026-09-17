# Docs API

## Purpose

Docs API owns document discovery, restricted MDX rendering, metadata indexing,
and the versioned Docs HTTP API.

## Dependencies

It uses the public `@codexsun/docs-contracts`, `@codexsun/framework`, and
`@codexsun/platform-core` contracts. Its document-library module owns Docs
domain behavior and persistence; it does not import another application's
private source.

## Configuration

Copy `.app.env.example` to the ignored `.app.env`. Configure the API host and
port, Docs vault path, index mode, web origin, and MariaDB connection values.

## Verification

Run `npm.cmd run typecheck --workspace @codexsun/docs-api`,
`npm.cmd run lint --workspace @codexsun/docs-api`, and
`npm.cmd run test --workspace @codexsun/docs-api`.
