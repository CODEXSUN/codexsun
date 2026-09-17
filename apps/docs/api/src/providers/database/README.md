# Docs MariaDB Provider

The Docs API composition root owns this concrete `DatabaseProvider` adapter.
It creates Kysely's MariaDB connection pool from the Docs `DB_*` configuration,
provides a bounded readiness query, and closes the pool during Fastify shutdown.

Version: `1.0.0`

Consumer: `docs.library.api` receives only its typed database provider. The
module owns the `docs_documents` table, migration, repository, and indexing
workflow.

Failure: database connection failures make `/health/ready` fail while liveness
remains available. Credentials are not logged.
