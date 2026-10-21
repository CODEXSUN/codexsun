# Sportsclub — Sports & Club Management

`apps/sportsclub` is the multi-tenant application for sports club administration, membership lifecycles, master/coach assignments, training progress tracking, and club member portals across CODEXSUN.

Platform supplies identity, tenant routing, Corporate ID selection, role grants, and shared infrastructure through public contracts. Sportsclub owns all club business data, persistence, fixed APIs, and private desk list/upsert forms. Sites owns public presentation and Cloudflare Workers, consuming Sportsclub's public contracts.

## Architecture and Boundaries

```text
apps/sportsclub/
  api/          # Backend package @codexsun/sportsclub-api (migrations, modules, repositories, services, routes, seeds)
  web/          # Frontend package @codexsun/sportsclub-web (workspaces, lists, forms, hooks, services, schemas)
  agent/        # Agent task, plan, and skills documentation
    TASK.md
    PLAN.md
    SKILLS.md
  README.md     # This document
```

### Tenancy and Routing Contract

- **Tenant Isolation**: Sportsclub runs against isolated tenant databases selected by the server runtime. It never trusts browser-supplied tenant IDs, database names, or role claims.
- **Tenkasi Sports Tenant**:
  - Tenant slug: `tenkasisports`
  - Proposed Corporate ID: `TENKASISPORTS`
  - Dedicated tenant database
  - Public marketing domain: `tenkasisports.com` (served by Sites Worker)
  - Backend API: `codexsun.com/api`
  - Authenticated member/desk portal: `app.codexsun.com`
- **Role Boundary**:
  - `Student`: Membership request, enrollment status, personal training feedback, and syllabus progress.
  - `Master`: Assigned student roster, training logs, attendance, and progress evaluations.
  - `Super Admin / Manager`: Membership review & approval, master assignments, discipline configuration, and club audit logs.

## Public Contracts and Exports

`@codexsun/sportsclub-api` provides browser-safe and server contracts:

- `./contracts`: Zod schemas for member enrollment, progress notes, and public roster queries.
- `./types`: TypeScript definitions for records, payloads, and audit events.

Student photos use the member-owned authenticated `PUT` and `GET /sportsclub/members/:uuid/photo` routes after a member is saved. The upload is bounded to 2 MiB of JPEG, PNG, or WebP bytes and stored in a tenant-private `sportsclub_member_photos` table. Club administrators upload; the student, an assigned active master, and club administrators may read. Photos are never part of the public roster or member list response. Existing tenant databases require the `sportsclub.member.photos` migration before photo upload.

Sites consumes these public contracts for public verification and portal redirect flows; club business logic, database migrations, and private management forms remain strictly inside `apps/sportsclub`.

## Source and Role Structure

Following the CODEXSUN module-owned CRUD pattern, Sportsclub API provides 8 discrete backend leaves:

- **`program`**: Discipline definitions (Silambam, athletics, martial arts), difficulty levels, age groups.
- **`master`**: Master/instructor profiles, experience years, primary disciplines, public biographies.
- **`member`**: Member rosters (students & masters), emergency contacts, guardian details, medical notes.
- **`session`**: Training schedules, recurring time windows, capacity limits, and venue locations.
- **`attendance`**: Session roll call, member participation logs, and status tracking.
- **`progress`**: Student assessments, syllabus stage grading, and master evaluations.
- **`event`**: Club demonstrations, tournaments, seasonal training camps, and workshops.
- **`enquiry`**: External visitor messages and program inquiries.

Sportsclub Web provides 9 matching frontend workspaces: `attendance`, `enquiry`, `event`, `master`, `member`, `overview`, `program`, `progress`, and `session`, rendered via `SportsclubWorkspace` inside Platform's `AppDesk`.

## Development and Verification

Run commands from the repository root:

```sh
npm run typecheck -w @codexsun/sportsclub-api -w @codexsun/sportsclub-web
npm run lint -w @codexsun/sportsclub-api -w @codexsun/sportsclub-web
npm run build -w @codexsun/sportsclub-api -w @codexsun/sportsclub-web
node tools/check-module-boundaries.mjs sportsclub
npm run check:component-docs
npm run test:component-docs
```

Local verification never proves production deployment. Production DNS, Cloudflare zone bindings, live backend routes, and live tenant databases must be independently verified. Local checks (including skipped MariaDB integration tests where test DBs are unconfigured and 404 live backend endpoints on un-deployed environments) must not be claimed as production proof or live data preservation proof.
