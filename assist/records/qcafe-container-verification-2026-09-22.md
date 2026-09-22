# Q Cafe Container Verification Record

Date: 2026-09-22

Environment: Windows local deployment through Docker Desktop. The Q Cafe API
uses `127.0.0.1:6220`. The Q Cafe web app uses `127.0.0.1:6221`.

## Deployment

- Docker Engine and client version: `29.8.0`.
- Docker Compose version: `5.5.1`.
- Runtime database driver: SQLite.
- Persistent data volume: `qcafe-data`.
- Persistent backup volume: `qcafe-backups`.
- The deployment reads the repository `.env` and Q Cafe API `.app.env` files at
  runtime. Docker excludes all environment files from image build contexts.

## Static Checks

| Check                                   | Result                                           |
| --------------------------------------- | ------------------------------------------------ |
| Q Cafe API type check and lint          | Passed.                                          |
| Q Cafe API tests                        | Passed: 26, skipped: 1 MariaDB integration test. |
| Q Cafe web type check and lint          | Passed.                                          |
| Root layout check                       | Passed.                                          |
| Docker Compose configuration validation | Passed.                                          |
| Changed-file whitespace validation      | Passed.                                          |
| Container image environment-file scan   | Passed. No `.env` or `.app.env` files found.     |

## Live Checks

- The setup script built both images and applied the serial migration plan.
- Migration verification found 15 Q Cafe lifecycle records.
- Identity preparation found three required users.
- The API and web containers reported healthy.
- Direct API health and the Nginx web route returned successful responses.
- An API restart preserved both lifecycle and identity record counts.
- The update script stopped writers, created a backup, verified current
  migrations, restarted the stack, and preserved both record counts.
- The backup volume contains `qcafe-20260922T020758Z.tar.gz` and
  `qcafe-20260922T020825Z.tar.gz`.
- The drop script refused to proceed without `QCAFE_CONFIRM_DROP=yes`.
- Browser verification rendered the Q Cafe home page with no console warnings
  or errors.

## Limits

- The repository-wide module boundary check is blocked by existing generated
  repositories under `apps/cxforge/.container/update.local.backups` and legacy
  modules under `apps/temp`. These paths are outside this Q Cafe change.
- `npm audit --omit=dev` reports six existing production dependency findings:
  five high and one critical. Available fixes require major upgrades to
  `mermaid` and `jspdf`, so dependency remediation is separate work.
- The MariaDB integration test remains opt-in and did not run in this SQLite
  deployment verification.
