# Zetro Foundation Module

## Purpose

This module composes the Zetro standalone runtime through `platform.core`.

## Provider

The provider ID is `zetro.foundation`. It publishes the Zetro health contract.

## Data

The module creates no table, migration, seeder, or SQLite connection. Z-1202
owns the SQLite lifecycle decision.

## Tests

Run `npm.cmd run test:zetro-api`.
