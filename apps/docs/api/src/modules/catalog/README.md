# Docs Catalog Module

## Purpose

This module registers the Docs catalog capability, health contract, and
derived SQLite document index.

## Provider

The provider ID is `docs.catalog`. It depends on `platform.core`.

## Contracts

The module exposes `GET /api/docs/v1/health`.

## Data

The module owns `docs-index.001`. It indexes allowed source files in place.
It deletes stale index records during a full sync. Source documents stay authoritative.

## Tests

Run the Docs API test command.
