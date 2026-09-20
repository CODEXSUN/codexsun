# Q Cafe Foundation Module

This module owns the Q Cafe application health and outlet foundation.

It uses Kysely as the primary typed SQL layer for local SQLite and cloud MariaDB.

The repository-level `DB_DRIVER` switch selects the active provider. Q Cafe
owns the local SQLite and identity paths under its private storage namespace.
The shared `DB_*` settings supply the MariaDB connection.

The `qcafe.foundation.setup.v1` contract owns businesses, locations, business days, service channels, and document sequences.
