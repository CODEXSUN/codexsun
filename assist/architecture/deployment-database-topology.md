# Deployment Database Topology

The repository contains many applications, but a deployment selects only the applications requested by a client.

## Database ownership

```text
master database
  platform identity, deployment settings, migrations, audit, jobs, outbox

application database
  one database for each selected application
  application identity and application-owned modules
```

The master database does not store application business tables. An application database does not store another application's records.

## Configuration

The root environment defines the master connection with `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME`.

An app may set a non-empty `DATABASE_URL` when the deployment gives that app a separate database endpoint. An empty app `DATABASE_URL` uses the root master connection only when the app explicitly selects the platform database. App identity must normally use its own database URL or SQLite path.

## Migration rules

- Development may run repeat-safe migrations and seeders at startup.
- Production must run an explicit migration command before the service starts.
- Production startup checks migration state and fails when a required migration is missing.
- Each migration and seeder has one owner module and a stable identifier.
- Each descriptor has a recorded SHA-256 checksum and immutable serial position.
- Migrations run serially before repeat-safe seeders. A failed descriptor stops the plan.
- Production migration execution is an explicit pre-start command; production startup only verifies the ledger.
- Migration state belongs to the database that owns the module.
- A deployment records selected applications and database endpoints before release.

## Rollout order

1. Prepare the master database.
2. Run Platform Identity migrations and seeders.
3. Start the Platform API and verify persistent identity reads.
4. Prepare one database for each selected application.
5. Run that application's identity migration and seeder.
6. Back up the selected database and capture the current lifecycle ledger.
7. Run the application's explicit migration command, then its verification command.
8. Start the application only after its production migration check passes.

The Platform host now follows this flow. Application hosts currently use their existing database-backed identity stores. Their migration command must be moved to the same explicit production check before MariaDB deployment.
