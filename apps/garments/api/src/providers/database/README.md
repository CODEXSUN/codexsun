# Garments MariaDB Provider

The Garments API composition root owns this concrete `DatabaseProvider` adapter.
It creates Kysely's MariaDB connection pool from the Garments `DB_*` configuration,
provides a bounded readiness query, and closes the pool during Fastify shutdown.

Version: `1.0.0`

Consumer: `garments.library.api` receives only its typed database provider. The
module owns the `garments_documents` table, migration, repository, and indexing
workflow.

Failure: database connection failures make `/health/ready` fail while liveness
remains available. Credentials are not logged.
