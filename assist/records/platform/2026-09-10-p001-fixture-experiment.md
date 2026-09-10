# P001 fixture experiment — 0.1.30

## Purpose and ownership

Start the next P001 step through installed Zetro, with a bounded Platform Identity task.
Repository version: 0.1.30. Identity runtime contract remains 1.3.0 because this adds test support only.
The installed desktop remains 0.1.29. This experiment does not certify production readiness.

## Zetro evidence

- Baseline commit: `4651075`.
- Task: `107d0e23-be67-4f68-9474-b839890d9845`.
- Conversation: `df7e4734-f012-4e3e-83c1-abfbd324d1a1`.
- Writable scope: `apps/platform` and `assist/records/platform` in an isolated worktree.
- Result: failed. An inspection searched nonexistent relative paths. A PowerShell line-count command also used invalid variable syntax.
- Zetro produced a candidate patch. The supervisor did not accept it unchanged or mark the failed job green.

## Reviewed implementation

The supervisor corrected the contract import, test counters, and test parameter types.
The supervisor added actual connection verification and empty-schema checks before any mutation.
The tests now exercise the connection checks through a fake Kysely driver, without network or database access.
The implementation binds its default repository and migrations to the checked connection.
It creates one regular, administrator, and super-admin account with hashed passwords and unique fixture emails.
It leaves device activation and permission policy unchanged.

The caller owns database provisioning, exclusive access, bounded connection settings, and cleanup.
This helper never creates or drops a database and never reads environment files.
Direct test migrations do not establish the production module-runtime ledger.
The later browser harness must disable that coordinator rather than rerun migrations.

## Verification

- Platform API tests: 16 passed, including four fixture safety tests.
- Platform API TypeScript check: passed.
- The existing Identity baseline passed before integration.
- Full `npm.cmd run check`: passed, including build, lint, formatting, boundaries, versions, regression tests, and server shutdown tests.
- Evidence: root `dist/platform-0.1.30-check.log`. The build produced the desktop executable, not an installer.
- Standalone fixture test typecheck: passed with `--types node,@fastify/cookie`. The initial command omitted the cookie augmentation and failed.
- No live MariaDB fixture, browser acceptance, installer build, installation, commit, push, or deployment ran for this experiment.

## Next experiment

Build the isolated browser runner around this fixture after its review passes.
Use a fresh database, database-scoped credentials, and preflight-reserved 6000-series ports.
Use one API origin, one web origin, and separate browser contexts for the three portals.
Verify positive login, cross-portal denial, first-device activation, and later-device approval.
Preserve real accounts and running services. Report cleanup evidence and every unverified item.
