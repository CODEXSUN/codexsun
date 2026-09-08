# Durable Module Runtime Preparation

## Status

Planned. No runtime code, database table, or migration exists for this phase.

## Objective

Prepare Platform API to persist module installation, migration, activation, and failure state in MariaDB.

The work must preserve API liveness when MariaDB is unavailable. Database failure must appear through readiness and module diagnostics.

## Authoritative references

- Application owner: [Platform](../../../apps/platform/README.md).
- Framework owner: [Framework](../../../packages/framework/README.md).
- Architecture plan: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md).
- Runtime rules: [Runtime foundation](../../architecture/runtime-foundation.md).
- Extension rules: [Application and add-on extension standard](../../architecture/extension-standard.md).
- Module rules: [Module standard](../../architecture/module-standard.md).

## Ownership boundaries

### Framework

The framework continues to own manifest parsing, semantic validation, composition plans, and in-memory lifecycle execution.

The framework must not import MariaDB, Kysely, MySQL2, Fastify, or Platform configuration.

### Platform Core API

Platform Core API may define stable repository and coordinator contracts after Platform API proves the first implementation.

Do not move the first implementation into Platform Core.

### Platform API

Platform API owns:

- MariaDB connections and transactions.
- Platform-owned installation and migration tables.
- Degraded startup behavior.
- Module-state readiness and diagnostics.
- The concrete runtime coordinator.

### Business modules and add-ons

Each module owns its migrations, checksums, seeds, upgrade behavior, and data-preservation policy.

A module cannot write another module's table. Platform state tables record lifecycle metadata only.

## Planned records

### Module installation record

Use one record per stable module ID.

Store:

- Module ID and kind.
- Installed version and requested version.
- Manifest checksum.
- Enabled status.
- Runtime state.
- Installation, upgrade, activation, and update timestamps.
- Last safe failure code and message.

### Module migration record

Use one record per module ID and migration ID.

Store:

- Module ID.
- Migration ID.
- Migration checksum.
- Module version.
- Applied timestamp.
- Execution duration.

Do not store raw SQL, secrets, or stack traces in these records.

## Runtime states

Use explicit states:

- `discovered`
- `validated`
- `installing`
- `installed`
- `migrating`
- `active`
- `deactivating`
- `disabled`
- `failed`

State changes must use one application service. Routes, modules, and workers cannot update state tables directly.

## Startup behavior

1. Start Fastify and liveness routes without waiting for MariaDB.
2. Check MariaDB through the readiness component.
3. Load durable module state when MariaDB becomes ready.
4. Compare installed versions with the immutable composition plan.
5. Run required module migrations in dependency order.
6. Activate eligible modules after migration succeeds.
7. Mark readiness unavailable when a required module fails.

The System module may remain available for diagnostics during degraded startup. Business routes must not run before their module becomes active.

## Migration rules

- Use ordered, module-owned migration IDs.
- Store and compare a deterministic checksum.
- Reject a changed checksum for an applied migration.
- Run one module migration transaction at a time.
- Use a database lock to prevent two runtime coordinators from migrating together.
- Keep migrations additive unless a documented major upgrade permits a destructive change.
- Make restart after an interrupted migration deterministic.
- Keep seeds separate and repeatable.

## Failure and recovery

- Keep liveness available after a database or migration failure.
- Set readiness to HTTP 503 for required module failures.
- Record a safe failure summary in module state.
- Log the full technical error with the request or operation correlation ID.
- Do not retry a checksum mismatch automatically.
- Allow an operator to retry a transient migration after the cause is fixed.
- Never purge module data during automatic recovery.

## Planned implementation order

1. Define Platform API module-state types and repository interface.
2. Add Platform-owned schema migrations.
3. Implement the MariaDB repository with Kysely.
4. Add a memory repository for isolated coordinator tests.
5. Define module-owned migration declarations.
6. Implement checksum validation and the migration lock.
7. Implement the degraded-startup runtime coordinator.
8. Add module-state readiness and System diagnostics.
9. Wire install, upgrade, activation, deactivation, and recovery.
10. Run MariaDB integration and production server lifecycle tests.

## Acceptance tests

- Clean database installation.
- Restart with an unchanged module version.
- Compatible module upgrade.
- Incompatible version rejection.
- Changed migration checksum rejection.
- Failed migration transaction rollback.
- Restart after an interrupted migration.
- Two coordinators competing for the migration lock.
- MariaDB unavailable during startup.
- MariaDB recovery after startup.
- Required module activation failure.
- Graceful `SIGINT`, `SIGTERM`, and supervisor IPC during module work.
- Database pool closure and port release.

## Parallel work boundaries

- The framework workstream owns manifest and composition contracts.
- The Platform runtime workstream owns state coordination and MariaDB adapters.
- A module workstream owns only its migration declarations and module data.
- The System workstream owns diagnostics routes and views.
- Each workstream must use public contracts and must not edit another module's private files.

## Preparation verification

- Confirmed that the current API starts liveness without a MariaDB connection.
- Confirmed that readiness already reports MariaDB failure separately.
- Confirmed that the framework has no database dependency.
- Confirmed that the root workspace keeps one dependency installation.
- No MariaDB integration test ran because this record does not add database behavior.

## Completion updates

When implementation starts, update this record with actual table names, contracts, migrations, commands, and results.

Update the Platform README, System README, module catalog, framework roadmap, local skills, and changelog in the same change.
