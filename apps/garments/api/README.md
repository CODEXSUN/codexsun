# Garments API

## Purpose

Garments API owns document discovery, restricted MDX rendering, metadata indexing,
and the versioned Garments HTTP API.

## Dependencies

It uses the public `@codexsun/garments-contracts`, `@codexsun/framework`, and
`@codexsun/platform-core` contracts. Its document-library module owns Garments
domain behavior and persistence; it does not import another application's
private source.

## Configuration

Copy `.app.env.example` to the ignored `.app.env`. Configure the API host and
port, Garments vault path, index mode, web origin, and MariaDB connection values.

## Verification

Run `npm.cmd run typecheck --workspace @codexsun/garments-api`,
`npm.cmd run lint --workspace @codexsun/garments-api`, and
`npm.cmd run test --workspace @codexsun/garments-api`.
