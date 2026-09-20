# Platform Core

`@codexsun/platform-core` composes the generic Platform runtime. Use
`createPlatformRuntime()` from an application composition root. Pass a named
deployable profile and its available application providers, then start and stop
the returned runtime.

`ModuleEnablementPolicy` requires each profile to select providers explicitly.
It rejects duplicate, unavailable, and dependency-incomplete selections before
the runtime starts.

The package owns the Platform Core provider, runtime registry, and enablement
policy. It does not own application routes, product modules, or client profiles.

`KyselyDataProvider` adapts an application-provided Kysely instance to the
Framework unit-of-work contract. It starts, commits, rolls back, and destroys
the database connection. It does not select a SQL dialect, define schemas, or
own module queries.

`createSqliteDataProvider()` creates an isolated SQLite Kysely provider from
an explicit filename. It enables foreign keys, WAL mode, and a 5-second busy
timeout. It uses the Node `node:sqlite` runtime and does not add a native
dependency directory to a workspace.

`createMariaDbDataProvider()` creates a Kysely provider from a root-managed
`mysql://` connection URL. It validates the URL before creating a pool. A host
must verify real database connectivity through a dedicated integration check.

Platform runtime configuration accepts `DB_DRIVER=sqlite` for its local
fallback. `DB_DRIVER=mariadb` requires `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, and `DB_MASTER_NAME` and builds a connection URL with encoded
credentials. A non-empty `DATABASE_URL` remains an explicit application
override.

`ModuleDataLifecyclePolicy` validates module-owned migration and seeder IDs,
ownership, and compatibility records. It does not run migrations or create a
schema. The selected deployment profile owns backup and restore operations.

`MigrationRunner` executes module migrations and repeat-safe seeders serially.
It records SHA-256 checksums, immutable sequence positions, timestamps, and run
counts in `platform_lifecycle_state`. Existing `platform_migration_state`
records are adopted once when their ordered IDs match. Production hosts call
`verify()` and use a separate explicit migration command before startup.

`LocalIdentityStore` applies the same rule to isolated application SQLite
identity databases. Its recorder stores serial positions and SHA-256 checksums;
development applies schema updates and repeat-safe identity seeds, while
production verifies the recorder without changing the database.

The public identity contracts define actors, roles, permissions, sessions, and
authorization decisions. They do not contain passwords, tokens, credentials,
tenant assignment, or an HTTP authentication method.

Browser hosts import identity contracts from `@codexsun/platform-core/identity`.
The root package entry also exports Node-only Platform adapters.

The [shared capabilities guide](../../assist/architecture/shared-capabilities.md)
lists reusable provider ports and server-side helpers. Mail, SMS, messenger,
printer, search, object storage, localization, and production secret services
require deployable-selected adapters. Platform Core does not select vendors.

Platform Core also provides optional scoped file and database session and cache
drivers. Select `SessionCacheProvider` only when a host needs these stores. The
database driver uses `platform_sessions` and `platform_cache` and requires its
explicit migration. Identity records and authorization remain database truth.
