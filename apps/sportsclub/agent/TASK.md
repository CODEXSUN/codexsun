# Sportsclub Task and Working Rules

## Purpose and Scope

`apps/sportsclub` establishes a dedicated multi-tenant application for sports club business records, memberships, master assignments, syllabus tracking, session attendance, progress grading, events, enquiries, and role-based member portals.

Platform manages identity, Corporate ID tenant selection (`TENKASISPORTS`), role grants, and tenant database routing. Sportsclub owns the business data, migrations, backend APIs, and authenticated desk forms. Sites owns the public presentation for `tenkasisports` and its Cloudflare Worker, consuming Sportsclub's public contracts.

## Task Inventory and Status

### Phase 1: Audit and Governance Alignment (Completed by AGR-5)
- [x] Read `assist/AGENT-GUIDE.md`, `assist/governance/rules.md`, and component documentation.
- [x] Read-only audit of AGR-1..4 outputs under `apps/sites`.
- [x] Identify architectural boundaries, tenant isolation requirements, role grants, and legacy unit test failures.
- [x] Verify source materials in `C:/Users/sunda/Desktop/veera/` (exact approved logo, Sivakalai Gurukulam student handbook, Asan T. Veerapandian syllabus).
- [x] Create canonical component documentation: `apps/sportsclub/README.md`, `agent/TASK.md`, `agent/PLAN.md`, `agent/SKILLS.md`.

### Phase 2: Sportsclub Multi-Tenant App Foundation (Completed by AGR-1..2)
- [x] Create `apps/sportsclub/api` (`package.json`, `tsconfig.json`, exports `./contracts`, `./types`, `./migration`, `./seed`).
- [x] Create `apps/sportsclub/web` (`package.json`, `tsconfig.json`, `@codexsun/sportsclub-web`).
- [x] Multi-leaf API architecture with 8 discrete modules: `program`, `master`, `member`, `session`, `attendance`, `progress`, `event`, and `enquiry`.
- [x] Multi-leaf Web architecture with 9 discrete modules: `attendance`, `enquiry`, `event`, `master`, `member`, `overview`, `program`, `progress`, and `session`.
- [x] Register tenant permissions in Platform: `sportsclub.portal.view`, `sportsclub.member.manage`, `sportsclub.progress.update`.
- [x] Platform Desk integration: `AppDesk.tsx` mounts `SportsclubWorkspace`, `router.tsx` mounts `/app/sportsclub/student`, `LoginPage.tsx` handles `?app=sportsclub`.
- [x] Platform test suite: `apps/platform/api/src/sportsclub-platform.test.ts` passed 8/8 tests.

### Phase 3: Sites Public Content & Logo Fidelity (Completed by AGR-3..4)
- [x] Ingest exact logo and branding assets for Tenkasi Sports.
- [x] Update `apps/sites/api/src/modules/site/page/page.sports-content.ts` with authentic Veerathamilan Traditional Sivakalai Gurukulam curriculum from the student handbook (Silambam basics, Varmam traditions, Asan T. Veerapandian).
- [x] Ensure no invented credentials, medical claims, schedules, fees, or addresses are published.
- [x] Update portal links to point directly to Platform desk (`https://app.codexsun.com/login?desk=tenant&app=sportsclub&corporateId=TENKASISPORTS`).
- [x] Add Cloudflare Worker configuration (`wrangler.tenkasisports.jsonc`, `tenkasisports.mjs`) and test suite (`tenkasisports.worker.test.ts` passed 7/7).

### Phase 4: Migration & Safe Cleanup of Sites Misplaced Code (Completed by AGR-5)
- [x] Verify `apps/sportsclub` API and Web modules build, pass boundary checks, and pass unit/integration tests.
- [x] Safely remove `apps/sites/api/src/modules/site/member/` and `apps/sites/web/src/modules/site/member/`.
- [x] Clean up dead member routes from `apps/sites/api/src/modules/site/site.routes.ts`, `site.migration.ts`, `site.types.ts`, and `overview.types.ts`.
- [x] Clean up dead member gateway and studio tab injections from `apps/sites/web/src/modules/site/site.studio.tsx`, `site.services.ts`, `site.types.ts`, and `overview.workspace.tsx`.
- [x] Cleanly eliminate the failing legacy Sites member test without leaving orphaned code or tests.
- [x] Ensure source cleanup preserves existing Sites client code (LogicX, Ramu Tex, Tirupur Connect). *Note: Zero actual user data loss cannot be asserted on live MariaDB databases because live migrations were not executed, and local MariaDB integration tests were skipped due to absent test DB configuration.*

### Phase 5: Verification and Final Reporting (Completed by AGR-5)
- [x] Execute `npm run check:component-docs` and `npm run test:component-docs` (30 owners verified).
- [x] Execute `node tools/check-module-boundaries.mjs sportsclub` (passed).
- [x] Execute `node tools/check-module-boundaries.mjs sites` (passed).
- [x] Run focused typecheck, lint, and unit tests across `@codexsun/sites-*` (passed).
- [x] Run `npm run test:cms -w @codexsun/sites-api` (13 passed, 1 opt-in MariaDB test skipped due to absent local test DB).
- [x] Run `apps/sites/clients/cloudflare/tenkasisports.worker.test.ts` (7 passed).
- [x] Verify live network state: `tenkasisports.com` actively resolves to Hostinger/LiteSpeed PHP server; live backend API endpoint `https://codexsun.com/api/sportsclub/v1/*` returns 404 (falling back to SPA HTML). Full live verification and production proof are explicitly disclaimed.
- [x] Ensure no commit, push, or production deployment is performed.

## Read-Only Audit & Cleanup History

1. **Boundary Resolution**: Misplaced club member code in Sites has been fully removed. Sportsclub is now the exclusive owner of all sports club business models, persistence, and private management desks.
2. **Legacy Test Elimination**: The obsolete `member.test.ts` under Sites was removed alongside the dead member module, resolving the strict schema payload failure cleanly.
3. **Sites Preservation**: Existing Sites clients (LogicX, Ramu Tex, Tirupur Connect) and CMS publication mechanisms remain untouched and fully passing locally.
4. **Limits & Caveats**:
   - Local verification does not constitute production proof.
   - MariaDB CMS persistence test was skipped locally due to the absence of a configured test MariaDB instance (`CODEXSUN_SITES_TEST_MARIADB=1`).
   - Live backend health for sportsclub endpoints on `codexsun.com` returns 404/HTML (pre-deployment state).
   - Zero actual production data loss cannot be asserted without access to live tenant databases.

## Concrete Evidence States

- Module boundaries verified: both `sites` and `sportsclub` pass `check-module-boundaries.mjs`.
- Component documentation verified: `apps/sportsclub` contains required `README.md`, `agent/TASK.md`, `agent/PLAN.md`, `agent/SKILLS.md`.
- No files committed or pushed.
- Unrelated dirty work in `apps/crm`, `apps/core`, `apps/docs`, and `assist/` preserved intact.

## Scoped Release Inventory & Safe Commit Strategy

### 1. Scoped File Breakdown

#### Group A: Exclusively Sportsclub & Tenkasi Sports (Safe to Commit in Isolation)
- `apps/sportsclub/` (Complete application: 8 backend API leaves, 9 frontend Web workspaces, component docs).
- `apps/sites/clients/public/tenkasisports/` & `apps/sites/clients/src/clients/tenkasisports/` (Tenkasi Sports public site).
- `apps/sites/api/src/modules/site/page/page.sports-content.ts` (Sivakalai Gurukulam curriculum content).
- `apps/sites/clients/cloudflare/tenkasisports.*` (`content.mjs`, `content.sql`, `mjs`, `worker.test.ts`, `wrangler.jsonc`).
- `apps/sites/clients/deploy/build.mjs`, `deploy/prepare.mjs`, `package.json`, `runtime/enquiry/enquiry.vite.mjs`, `src/index.ts`, `vite.config.ts`.
- `apps/sites/api/src/modules/site/page/page.defaults.ts`, `page.public-routes.ts`, `page.seed.ts`, `site.runtime.ts`, `site.seed.ts`, `site.service.ts`.
- `apps/sites/web/src/modules/site/site.runtime-controls.tsx`.
- `apps/platform/api/src/sportsclub-*` (`contract.ts`, `host.ts`, `identity.ts`, `platform.test.ts`, `public-client.ts`).
- `apps/platform/api/src/tenkasisports-tenant.ts`.
- `apps/platform/web/src/desks/tenant/SportsclubStudentDesk.tsx`.
- `apps/platform/web/src/modules/sportsclub/`.

#### Group B: Mixed Files with Interleaved Hunks (Requires Hunk-Level Extraction)
- `apps/platform/api/src/app.ts`:
  - Contains `registerSportsclubHost(app)` (Sportsclub) alongside concurrent `registerDataMigrationHost(app)` (Data Migration).
- `package-lock.json`:
  - Contains `@codexsun/sportsclub-*` dependencies alongside concurrent `@codexsun/data-migration-*` dependencies.
- `tools/check-module-boundaries.mjs`:
  - Contains boundary configurations for both `sportsclub` and `data-migration`.
- `assist/architecture/module-boundaries.md` & `assist/documentation/project-inventory.md`:
  - Interleaved inventory records for both Sportsclub and Data Migration.

#### Group C: Unrelated Concurrent In-Flight Work (Strictly Excluded)
- `apps/crm/` (14 API & Web files + `tools/e2e/crm-work-reports.e2e.ts`).
- `apps/core/` (`README.md`, `TASK.md`, `tenant-permission.seed.ts`).
- `apps/docs/` (17 sources + `catalog.json`).
- `devkits/data-migration/`, `apps/platform/api/src/data-migration-host.ts`, `tools/e2e/data-migration.e2e.ts`, `package.json` (`test:e2e:data-migration`).
- `assist/documentation/CHANGELOG.md` (uncommitted CRM/Core entries).

### 2. Isolated Branch & Commit Safety Analysis

1. **Shared Working Copy Invariant**:
   - The repository root `D:/workspace/codexsun` is the canonical working tree shared by concurrent agents (including AGR-3).
   - Running `git checkout -b <branch>` or switching branches alters `HEAD` and the shared index, which would disrupt AGR-3's ongoing file writes and carry all in-flight dirty files from CRM, Core, and Data Migration into the new branch.
2. **Safe Isolated Commit Path (When Authorized)**:
   - To commit without switching branches or polluting the shared working tree:
     - Use a temporary detached index (`$env:GIT_INDEX_FILE = "...tmp_index..."`).
     - Stage only Group A files and the Sportsclub-specific hunks of Group B.
     - Write a git tree using `git write-tree` and commit directly to a dedicated ref (e.g. `refs/heads/codex/tenkasisports`) via `git commit-tree` pointing to the current `HEAD`.
     - Push the ref to remote (`git push origin codex/tenkasisports`) without touching the working tree or branch state.
3. **Current Action State**:
   - As directed by governance rules and system instructions, **no staging, branch-switch, commit, push, or version bump** has been executed.

### 3. Version and Changelog Implications

- **Version Number**:
  - In accordance with `assist/AGENT-GUIDE.md`, version bumps occur only when explicitly authorized. Root `package.json` remains at `1.1.21`.
- **Changelog Scope**:
  - `assist/documentation/CHANGELOG.md` currently contains uncommitted entries for Core/CRM reads. Any Sportsclub changelog entry must be appended atomically during release preparation without clobbering concurrent entries.
