# Identity Data Lifecycle

Module ID: `platform.identity`

Migration `identity.001` creates actors, roles, actor roles, and explicit actor
permissions. The migration has a matching revert function. It has not run in a
shared MariaDB deployment.

Seeder `identity.seed.001` adds role definitions only. It is repeat-safe and
does not create credentials, users, or sessions.

Compatibility level: `backward-compatible` for a new module.

Rollback limit: rollback drops all Identity tables. Do not run rollback after
another module depends on Identity data.

SQLite migration and repeat-seed checks pass. MariaDB deployment and restore
evidence remain required before production use.
