# Zetro Storage Module

## Purpose

This module owns the Zetro SQLite readiness boundary. It checks the configured
database without creating Zetro workflow tables.

## Provider

The provider ID is `zetro.storage`. It depends on `platform.core` and publishes
the `zetro.sqlite` readiness contract.

## Data

The SQLite file is private Zetro runtime storage. Z-1202 creates no schema or
migration. Future Zetro data modules own their migrations and repositories.

## Tests

Run `npm.cmd run test:zetro-api`.
