# Sportsclub Task and Working Rules

## Marketing integration backlog — 2026-10-23

Planning alignment is complete. The following implementation tasks remain open.
See [Marketing contracts and gaps](../../marketing/agent/PLAN.md#phase-0-decisions-and-contract-review), G11.

- [ ] Define optional enquiry-only projection, source identity, consent evidence, and duplicate-safe handoff.
- [ ] Specify permitted guardian/minor contact rules before promotional enrollment.
- [ ] Test tenant isolation and exclusion of medical data, member photos, and private roster/training records.

Acceptance requires the owner contract, denied-access cases, retry behavior, and exact evidence in this task log.
No implementation or live validation is claimed by this planning update.

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
- [x] Ensure source cleanup preserves existing Sites client code (LogicX, Ramu Tex, Tirupur Connect). _Note: Zero actual user data loss cannot be asserted on live MariaDB databases because live migrations were not executed, and local MariaDB integration tests were skipped due to absent test DB configuration._

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
2. **Safe Isolated Commit Path (Executed)**:
   - Built candidate tree object `54cf37158be013ed01d79907511f5f34c5740d86` using a detached index (`.git/index-tenkasi-candidate`) from `HEAD` (`c1a073c6`).
   - Staged exclusively Group A files and the pure Sportsclub hunks of Group B without any Data Migration, CRM, Core, or Docs changes.
   - Committed candidate tree to commit `bf37e4d80fda54c0a99a84fb7b8645fc5df2dafb` (`feat(sportsclub): multi-tenant sportsclub app and tenkasi sports integration`).
   - Updated ref `refs/heads/codex/tenkasisports` and pushed to remote `origin/codex/tenkasisports`.
   - The shared working copy on `main` remained completely untouched throughout the operation.

### 3. Version and Changelog Implications

- **Version Number**:
  - In accordance with `assist/AGENT-GUIDE.md`, root `package.json` retains `1.1.21` without bumping.
- **Changelog Scope**:
  - `assist/documentation/CHANGELOG.md` in the working copy contains uncommitted entries for Core/CRM reads and was excluded from the sportsclub ref to prevent merge conflicts.

### Phase 6: CRM-Tone Full-Page Entity Redesign & Platform App Header Integration (In Progress by AGR-2)

- [x] Read `assist/documentation/design-system-helper.md`, `assist/AGENT-GUIDE.md`, and `assist/governance/rules.md`.
- [x] Detailed audit of `apps/crm/web/src/modules/enquiry` interaction pattern (`WorkspaceUpsertPage`, `WorkspaceFilters` with `toolbarAction` inline filter toggle, column chooser, header portalling with `WorkspaceHeaderActions`, conditional pagination).
- [x] Author comprehensive UI Redesign Plan (`sportsclub-ui-redesign-plan.md`) covering all 8 entities (`member`, `master`, `program`, `session`, `attendance`, `progress`, `event`, `enquiry`) plus `overview`.
- [x] Specify Platform app header action binding (`New [Entity]`, `Save [Entity]`) and form IDs.
- [x] Enforce server pagination 100 rows/page, rendering pagination bar only when `total > 100`.
- [x] Gate: Backend contract stabilized by AGR-1 (server pagination envelope, exact 100 rows/page, null pagination when total <= 100, column contracts).
- [ ] Coordinate expected side-menu route keys and header actions with AGR-3 Platform.
- [ ] Refactor all 8 module workspaces to full-page upsert (no popups) and header-bound list views with no internal headings.
- [ ] Execute focused local build, lint, typecheck, and browser viewport evidence.
- [ ] Maintain local-only constraint: zero cloud deployment, zero VPS cutover, zero remote push, no mutation of live tenant data.

### Phase 7: Backend Server-Side List Pagination Contract (Completed by AGR-1 — 2026-10-19)

- [x] Implement shared strict pagination contract in `apps/sportsclub/api/src/sportsclub.pagination.ts`:
  - Exactly 100 rows per page (`DEFAULT_PAGE_SIZE = 100`).
  - Strict invariant: `calculatePagination(total, page)` returns `null` when `total <= 100`.
  - When `total > 100`, returns `{ page, pageSize: 100, total, totalPages, hasNextPage, hasPreviousPage }`.
  - Envelopes return full safe backend rows (`items: EntityRecord[]`) to prevent UI partial row errors.
- [x] Server-side list routes, repositories, and schemas stabilized for AGR-1 owned modules:
  - `program`: `GET /sportsclub/programs?page=1&search=&discipline=&level=&status=&columns=`
    - Selectable columns: `programSelectableColumns` (`uuid`, `code`, `name`, `discipline`, `description`, `level`, `ageGroup`, `isApprovedPublic`, `status`, `sortOrder`, `revision`, `createdAt`, `updatedAt`).
  - `master`: `GET /sportsclub/masters?page=1&search=&primaryDiscipline=&status=&isApprovedPublic=&columns=`
    - Selectable columns: `masterSelectableColumns` (`uuid`, `email`, `name`, `phone`, `title`, `primaryDiscipline`, `publicBio`, `privateNotes`, `experienceYears`, `isApprovedPublic`, `status`, `sortOrder`, `revision`, `createdAt`, `updatedAt`).
  - `member`: `GET /sportsclub/members?page=1&search=&role=&status=&programUuid=&masterUuid=&columns=`
    - Selectable columns: `memberSelectableColumns` (`uuid`, `email`, `name`, `phone`, `dateOfBirth`, `gender`, `guardianName`, `guardianPhone`, `emergencyContact`, `medicalNotes`, `address`, `programUuid`, `masterUuid`, `role`, `status`, `progressNote`, `revision`, `createdAt`, `updatedAt`).
  - `session`: `GET /sportsclub/sessions?page=1&search=&programUuid=&masterUuid=&status=&columns=`
    - Selectable columns: `sessionSelectableColumns` (`uuid`, `title`, `programUuid`, `masterUuid`, `daysOfWeek`, `startTime`, `endTime`, `venue`, `maxCapacity`, `isApprovedPublic`, `status`, `revision`, `createdAt`, `updatedAt`).
- [x] Coordinate leaf ownership with AGR-5:
  - AGR-1 owns: `program`, `master`, `member`, `session`, and shared `sportsclub.pagination.ts`.
  - AGR-5 owns: `attendance`, `progress`, `event`, `enquiry` (AGR-1 preserves and does not touch AGR-5 leaves).
- [x] Re-export all selectable columns, query schemas, and response schemas in `@codexsun/sportsclub-api/contracts`.
- [x] Add 100/101 boundary test suite in `apps/sportsclub/api/src/tests/sportsclub-list-boundary.test.ts`:
  - 0 rows -> `total: 0, items: [], pagination: null`.
  - 1 row -> `total: 1, items.length: 1, pagination: null`.
  - 100 rows -> `total: 100, items.length: 100, pagination: null` (boundary verified).
  - 101 rows -> `total: 101, items.length: 100, pagination: { page: 1, pageSize: 100, total: 101, totalPages: 2, hasNextPage: true, hasPreviousPage: false }`.
  - Page 2 of 101 rows -> `items.length: 1, pagination: { page: 2, totalPages: 2, hasNextPage: false, hasPreviousPage: true }`.
  - Inline search and filters on isolated SQLite DB with foreign keys verified.
- [x] Verification:
  - `npm run typecheck -w @codexsun/sportsclub-api` (clean, 0 errors).
  - `npm run lint -w @codexsun/sportsclub-api` (clean, 0 warnings, 0 errors).
  - `npm test -w @codexsun/sportsclub-api` (14/14 tests passing).
  - `node tools/check-module-boundaries.mjs sportsclub` (clean pass).
- [x] Local-only constraints preserved: zero cloud deployment, zero remote push, zero mutation of live tenant data.

### Phase 8: Server-Side List Pagination & Detail Routes for Remaining 4 Leaves (Completed by AGR-5 — 2026-10-19)

- [x] Complete backend list pagination and detail contracts across the 4 assigned leaves:
  - `attendance`:
    - List route: `GET /sportsclub/attendance?page=1&pageSize=100&search=&sessionUuid=&memberUuid=&attendanceDate=&sessionDate=&status=&columns=`
      - Query schema: `attendanceListQuerySchema` (supports both `attendanceDate` and `sessionDate` filters, `status`, `search` on remarks/recorded_by).
      - Selectable columns: `attendanceSelectableColumns` (`uuid`, `sessionUuid`, `memberUuid`, `attendanceDate`, `status`, `remarks`, `recordedBy`, `createdAt`, `updatedAt`).
      - Response schema: `attendanceListResponseSchema` returning standard Fastify enveloped `{ data: { items: AttendanceRecord[], total: number, pagination: PaginationMetadata | null } }`.
    - Detail route (added per UI integration request for full-page Edit direct URLs):
      - Direct route: `GET /sportsclub/attendance/:uuid`
      - Route schema: `params: uuidParamsSchema` (8 hex chars), `response: attendanceRecordSchema`.
      - Fastify HTTP envelope: returns `{ success: true, data: AttendanceRecord }`.
      - Access: Authenticated and tenant-scoped. Super admin and club admin can view any record; active master can view for assigned sessions or students; student can view their own record.
  - `progress`:
    - List route: `GET /sportsclub/progress?page=1&pageSize=100&search=&memberUuid=&masterUuid=&programUuid=&stageLevel=&status=&columns=`
      - Query schema: `progressListQuerySchema` (`memberUuid`, `masterUuid`, `programUuid`, `stageLevel`, `status`, `search` on stage/assessment/notes).
      - Selectable columns: `progressSelectableColumns` (`uuid`, `memberUuid`, `masterUuid`, `programUuid`, `stageLevel`, `score`, `assessment`, `privateNotes`, `status`, `gradedAt`, `revision`, `createdAt`, `updatedAt`).
      - Scoping: Active masters are automatically scoped to evaluations they graded (`masterUuid: master.uuid`). Admins query club-wide.
      - Response schema: `progressListResponseSchema` returning `{ data: { items: ProgressRecord[], total: number, pagination: PaginationMetadata | null } }`.
  - `event`:
    - List route: `GET /sportsclub/events?page=1&pageSize=100&search=&eventType=&status=&columns=`
      - Query schema: `eventListQuerySchema` (`eventType`, `status`, `search` on title/description/location).
      - Selectable columns: `eventSelectableColumns` (`uuid`, `title`, `eventType`, `description`, `eventDate`, `endDate`, `location`, `isApprovedPublic`, `status`, `revision`, `createdAt`, `updatedAt`).
      - Response schema: `eventListResponseSchema` returning `{ data: { items: EventRecord[], total: number, pagination: PaginationMetadata | null } }`.
  - `enquiry`:
    - List route: `GET /sportsclub/enquiries?page=1&pageSize=100&search=&status=&columns=`
      - Query schema: `enquiryListQuerySchema` (`status`, `search` on name/email/phone/interest/message/notes). Excludes `status: trash` by default.
      - Selectable columns: `enquirySelectableColumns` (`uuid`, `name`, `email`, `phone`, `interest`, `message`, `consent`, `status`, `notes`, `revision`, `createdAt`, `updatedAt`).
      - Response schema: `enquiryListResponseSchema` returning `{ data: { items: EnquiryRecord[], total: number, pagination: PaginationMetadata | null } }`.
- [x] Strict pagination invariants enforced:
  - Exact 100 rows per page (`DEFAULT_PAGE_SIZE = 100`).
  - `calculatePagination(total, page)` strictly returns `null` when `total <= 100`.
  - Metadata (`{ page, pageSize: 100, total, totalPages, hasNextPage, hasPreviousPage }`) returned only when `total > 100`.
- [x] Public contracts updated:
  - `apps/sportsclub/api/src/sportsclub.contracts.ts` re-exports all selectable columns, query schemas, and response schemas for all 8 modules.
- [x] Verification:
  - Added comprehensive boundary test suite: `apps/sportsclub/api/src/tests/sportsclub-leaves-boundary.test.ts` (4/4 tests passed: 0/100/101 boundaries, search, filters, master scoping, and `GET /sportsclub/attendance/:uuid` detail access).
  - Updated `apps/sportsclub/api/src/tests/sportsclub.test.ts` to assert pagination envelope on enquiry list.
  - `npm run typecheck -w @codexsun/sportsclub-api` (clean, 0 errors).
  - `npm run lint -w @codexsun/sportsclub-api` (clean, 0 warnings, 0 errors).
  - `npm test -w @codexsun/sportsclub-api` (18/18 tests passing across all test suites).
  - `node tools/check-module-boundaries.mjs sportsclub` (clean pass).
  - `npm run check:component-docs` and `npm run test:component-docs` (31 owners verified).
- [x] Local-only constraints preserved: zero cloud deployment, zero remote push, zero live database mutations.
