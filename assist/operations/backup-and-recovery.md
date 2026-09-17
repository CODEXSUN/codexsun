# Backup And Recovery

## Database Backup

The deployment owner schedules MariaDB backups. Store encrypted backups outside the application host. Record the backup time, retention period, and restore owner in the deployment record.

Before a migration, capture the migration state and create a backup. After a migration, verify the changed module data.

## Storage Backup

Back up `storage/apps/private/` and any selected public storage namespace. Keep application and module paths in the backup. Do not restore one module over another module namespace.

## Restore Test

1. Restore a non-production database copy.
2. Restore a non-production storage copy.
3. Run module migration status checks.
4. Check a known application flow and its stored file access.
5. Record the result and the recovery time.

## Incident Response

Stop the affected deployment only when its owner confirms the process. Preserve safe logs and state before a rollback. Do not delete failed outbox records. An operator reviews failed records before retry or discard.
