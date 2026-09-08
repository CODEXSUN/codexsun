# Module Runtime API

## Purpose

The module owns durable Platform module state, migration history, seed history, and preparation diagnostics.

## Identity and version

- Module ID: `module-runtime`
- Kind: `core`
- Version: `1.0.0`
- Scope: `platform`
- Status: `active`

## Ownership

- Entities and records: Installed module state, applied migrations, and applied seeds.
- Tables: `platform_module_state`, `platform_module_migrations`, and `platform_module_seeds`.
- Routes and UI paths: None. The System module exposes read-only diagnostics.
- Permissions and settings: Platform runtime only.

## Public contracts

- API: `module-runtime.state` version `1.0.0`.
- Events published: `module-runtime.module-prepared` version `1.0.0`.
- Events consumed: None.
- Dependencies and version ranges: Platform `^0.1.0`.

## Extension bindings

- Extension points provided: None.
- Contributions supplied: None.
- Point version ranges and order: Not applicable.

## Lifecycle

- Install: Create the module runtime tables before other module data runs.
- Activate: Prepare module migrations and seeds in dependency order.
- Upgrade: Compare installed versions and immutable migration checksums.
- Deactivate: Stop new module preparation work before database shutdown.
- Uninstall: Preserve module and business data by default.

## Persistence

- Migrations: `module-runtime.migrations.ts` owns ordered schema changes.
- Seeds: `module-runtime.seeds.ts` owns repeatable runtime self-registration.
- Upgrade compatibility: Applied migration and seed checksums cannot change.

Each persistent module must keep its migrations and seeds inside its own module folder. The composition root only supplies the database transaction adapter.

## Verification

- Unit tests cover dependency ordering, restart idempotency, checksum rejection, durable state, declared events, and diagnostics.
- The production API lifecycle test covers the compiled server, degraded liveness while module preparation fails, readiness, signal and IPC shutdown, and port release.
- A live MariaDB integration test remains required when a configured database is available.

## Development records

- [2026-09-08 Durable module runtime](../../../../../../assist/records/platform/2026-09-08-durable-module-runtime.md)
