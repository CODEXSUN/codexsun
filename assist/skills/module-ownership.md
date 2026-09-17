# Module Ownership Skill

## Purpose and Scope

Use this skill when you create, change, review, or move a CODEXSUN module. A
module owns one business capability in the modular monolith.

## Required Shape

Keep all applicable module code in one owned folder:

```text
modules/<module>/
  provider.ts
  domain/
  contracts/
  services/
  repository/
  controller/
  routes/
  migrations/
  seeders/
  events/
  test/
  README.md
```

Do not create empty folders only to satisfy this shape. Add a folder when the
module needs that responsibility.

## Boundary Rules

1. The provider declares module presence and public contracts.
2. Routes call the owner controller or service. They do not call repositories directly.
3. Services hold use-case behavior. Repositories hold persistence access.
4. Migrations and seeders stay with the module that owns the tables.
5. Events are facts emitted after a successful transaction. Consumers stay idempotent.
6. Other modules use documented contracts only. They do not import private files.
7. Shared UI belongs in `packages/ui`. App UI composes public exports.

## Verification and Records

Add focused tests for public behavior and boundary failures. Update the module
README and `assist/modules/registry.md`. Record data changes separately in the
changelog. Run the module check and the root workspace check.

## Exclusions

Do not move unrelated domain behavior into a common folder. Do not share a
repository, controller, migration, or service only to reduce file count.
