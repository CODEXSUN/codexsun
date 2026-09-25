# Q Cafe Release Verification

## Context

QC-0905 requires focused API, web, desktop, migration, recovery, and end-to-end verification with the release record separating completed proof from untested deployment and production claims. This record covers the Q Cafe application after Phase 6 (QC-0601–0606), Phase 7 (QC-0701–0706), Phase 8 (QC-0801–0805), and Phase 9 (QC-0901–0903) delivery.

## Completed Proof

- API static checks: `tsc --noEmit`, ESLint, and the esbuild production bundle pass for `@codexsun/qcafe-api`.
- API tests: full suite passes, 62 passed, 0 failed, 1 skipped. The skip is the opt-in MariaDB integration test, which requires an explicit test database URL. The suite includes all Phase 6–9 module tests (inventory, documents, backup, sync, marketplace, accounting, reports, policies) plus the pre-existing foundation, menu, POS, billing, booking, and settings suites.
- Ledger-count hardening: five legacy tests asserted a hardcoded lifecycle total of 15 and failed after the new modules grew the ledger to 32 descriptors. Each now derives its expectation from `lifecycleDescriptorTotal()`, so future module additions no longer break them.
- Web static checks and build: `tsc --noEmit`, ESLint, and the Vite production build pass for `@codexsun/qcafe-web` (one chunk-size warning, no errors).
- Migration: clean-database dry run applied 29 migrations and verified 32 ledger records with zero mismatches; see `2026-09-24-qcafe-migration-dryrun.md`. The same plans were then applied to the shared development MariaDB (`database:migrate` + `database:verify`, 33 records), which caught and fixed a MariaDB-only foreign-key ordering fault in `qcafe.inventory.005`.
- Browser E2E: two Playwright specs pass against isolated API (SQLite) and web dev servers — dev auto-login to the Overview KPIs, plus seeded business/day proving the Inventory and Reports desks render with shared components (`apps/qcafe/web/e2e/smoke.spec.ts`, `test:e2e` script).
- Recovery: the backup restore-check flow (record, fail with detail, pass to verified, verified-gate on schedule disable) is covered by focused tests.
- `git diff --check` is clean for `apps/qcafe` and the new record files.

## Explicitly Untested

- Live MariaDB integration tests (opt-in suite) were not run; migration apply/verify on MariaDB is proven.
- Docker container builds, the `.container/` backup scripts, and desktop data-folder behavior on Windows were not executed.
- Production deployment, production migration execution, and production traffic verification were not performed. Nothing in this record claims production readiness.

## Scope Notes

- Q Cafe ships API and web hosts only; there are no Q Cafe desktop or mobile hosts, so no desktop or mobile target verification applies.
- Changelog entries for Phase 6–9 work are pending the next explicit version bump; task completion is recorded in `apps/qcafe/agent/exec/qcafe-task.md`.

## Verification

- Owner: `apps/qcafe`. Review date: 2026-09-25. Evidence: API suite output (62/0/1), web build output, and the migration dry-run record above.
