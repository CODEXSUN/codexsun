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

`ModuleDataLifecyclePolicy` validates module-owned migration and seeder IDs,
ownership, and compatibility records. It does not run migrations or create a
schema. The selected deployment profile owns backup and restore operations.
