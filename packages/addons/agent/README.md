# Business Add-On Agent Guide

This guide defines how agents build and maintain CODEXSUN business add-ons under `packages/addons/`.

## Context

The repository uses a modular monolith. Each add-on owns one domain package, provider, public contracts, tests, and documentation. Applications select add-ons through `core/registry/profiles`.

## Boundaries

- Keep runtime add-ons under `packages/addons/<id>`.
- Keep registry metadata under `core/registry/addons/<id>.json`.
- Keep shared provider and frontend helpers in `packages/addons/runtime`.
- Use Framework and Platform Core contracts for provider lifecycle, identity, data lifecycle, and capabilities.
- Do not import private files from applications or other add-ons.
- Do not duplicate identity, authorization, storage, database, event, or notification systems.

## Execution

1. Read `planner.md`.
2. Select the first executable task in `task.md`.
3. Inspect the owning package and its consumers.
4. Define the public contract before implementation.
5. Add focused tests with the behavior.
6. Run type checks, tests, boundary checks, and build checks.
7. Update the add-on README and task evidence.
8. Mark the task complete only after verification passes.

## Documentation

Every add-on README must state its purpose, owner, public contracts, dependencies, configuration, storage, events, local setup, and verification commands. Do not document credentials or unsupported production behavior.

## Completion

The current suite provides provider, service, frontend, registry, test, and documentation foundations. Add-on persistence, external adapters, application routes, and production deployment require follow-up tasks.
