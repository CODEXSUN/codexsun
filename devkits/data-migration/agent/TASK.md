# Data Migration tasks

- [x] Add a Super Admin-only Overview and Migration desk.
- [x] Add Migration Settings for saved external MariaDB host, port, database, user, TLS, and encrypted password management.
- [x] Add searchable saved-source choices and Create actions for non-secret fields, with common MariaDB port choices.
- [x] Save a connection without a database, then fetch and filter its databases before choosing one for migration.
- [x] Verify the local desk places Database last, disables it before the first save, and keeps it optional.
- [x] Save verified external MariaDB sources with encrypted passwords and select registered destination tenants without exposing credentials.
- [x] Require TLS by default, and provide source recheck and disable actions in Migration Settings.
- [x] Preview matching table columns and row counts before copying.
- [x] Require an empty destination and write one audited transaction.
- [x] Verify a disposable external-source-to-destination MariaDB transfer, failed transaction rollback, and denied API access. `npm run test:e2e:data-migration` passed locally on 19-10-2026.
- [x] Verify local Super Admin browser navigation, Overview data, Migration page, and the external-source form on 19-10-2026.
- [x] Offer the current Platform MariaDB connection as a server-side saved-source preset without exposing its password.
- [x] Add a trash action to remove a saved source, erase its saved password, and retain migration history.
- [x] Verify the local Migration Settings page, required-field feedback, and navigation to and from Migration on 19-10-2026.
- [x] Upgrade an earlier local master schema with the second migration step; confirm both desk data queries succeed.
- [ ] Verify a named live tenant transfer after separate operational review.
- [ ] Add durable queued runs and resumable pagination for tables larger than 10,000 rows.

Static checks and source presence do not establish deployed or live behavior. Record exact check results before closing the remaining tasks.
