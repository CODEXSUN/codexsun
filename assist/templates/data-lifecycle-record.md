# Data Lifecycle Record

## Owner

- Module ID:
- Module folder:
- Data owner:

## Migrations

List migrations in immutable execution order. Include the owner, stable ID,
canonical checksum definition, SHA-256 checksum, compatibility effect, and
rollback limit. Append new migrations; do not edit recorded entries.

| Order | ID  | SHA-256 | Description | Fresh check | Upgrade check |
| ----: | --- | ------- | ----------- | ----------- | ------------- |
|       |     |         |             |             |               |

## Seeders

List repeat-safe seeders in immutable execution order. Include the owner,
stable ID, canonical checksum definition, SHA-256 checksum, and expected result
after repeated execution.

| Order | ID  | SHA-256 | Description | Repeat-safe check |
| ----: | --- | ------- | ----------- | ----------------- |
|       |     |         |             |                   |

## Compatibility

- Level: `backward-compatible` or `coordinated-release`
- Summary:
- Rollback limit:

## Backup And Restore

- Backup owner:
- Backup retention:
- Restore owner:
- Restore verification date:
- Restore evidence:

## Release Evidence

- Clean database result:
- Upgrade database result:
- Repeat-seed result:
- Deployment profile:
- Changelog version:
