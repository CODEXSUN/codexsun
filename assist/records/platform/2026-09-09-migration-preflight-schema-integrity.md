# Migration Preflight and Schema Integrity

Date: 2026-09-09

## Outcome

Platform API now checks MariaDB during development preflight. Application startup applies queued module migrations and validates module-owned schema fingerprints before activation.

## Versions

- Application version: `0.1.6`.
- Module Runtime version: `1.1.0`.
- Module Runtime schema version: `1.1.0`.
- New migration: `0002-module-schema-checksum`.

## Ownership and bindings

- Platform Core defines the runtime schema inspection contract.
- Framework manifests declare a module data schema version and checksum.
- Each persistent module owns its migrations, seeds, and schema inspector.
- Module Runtime owns migration coordination, the ledger, the advisory lock, and schema comparison.
- Preflight runs the application-account smoke test before port reservation.
- The version workflow updates `CODEXSUN_VERSION` in environment files. The version check rejects a stale `.env.example` value.

## Runtime sequence

1. Preflight builds required workspace packages.
2. Preflight confirms the application can query MariaDB.
3. Platform starts and takes the module migration lock.
4. Module Runtime compares applied migration checksums.
5. Module Runtime applies missing migrations in dependency order.
6. Each module inspects its current schema structure.
7. Module Runtime compares the live checksum with the manifest checksum.
8. The application activates modules and reports ready status.

Business rows are not part of the schema checksum. Normal data changes must not trigger a migration failure.

## Failure behavior

- A connection failure stops development preflight before port reservation.
- A changed applied migration checksum stops module preparation.
- A live schema mismatch marks the owning module failed.
- Liveness stays available after a runtime migration failure.
- Readiness stays unavailable until the schema matches a declared forward migration.

## Verification

- `npm.cmd run mariadb:smoke`
- `npm.cmd run test:mariadb:foundation`
- Live Platform preflight, readiness, and port-release checks
