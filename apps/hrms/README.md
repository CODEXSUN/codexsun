# HRMS

HRMS means **Human Resource Management System**. Its purpose is people and workforce administration.

## Implemented app foundation

- Separate `@codexsun/hrms-api` and `@codexsun/hrms-web` workspaces, versioned with the repository.
- Tenant launcher entry, app switching and default-landing selection.
- An app-owned desk with **Overview**, **Employees** and **Attendance** side-menu entries.
- Authenticated, permission-checked overview with employee and attendance summaries, recent attendance, and links to current HRMS workflows.

| Contract                     | Value                                  |
| ---------------------------- | -------------------------------------- |
| App / entitlement key        | `hrms`                                 |
| Overview module / permission | `hrms.overview` / `hrms.overview.view` |
| Desk URL                     | `/app/hrms/overview`                   |
| Employees URL                | `/app/hrms/employees`                  |
| Attendance URL               | `/app/hrms/attendance`                 |
| New employee URL             | `/app/hrms/employees/new`              |
| Edit employee URL            | `/app/hrms/employees/{uuid}/edit`      |
| Browser employee API         | `/api/app/hrms/employees`              |
| Browser overview API         | `GET /api/app/hrms/overview`           |
| Module-owned API route       | `GET /hrms/overview`                   |
| Attendance API route         | `/hrms/attendance`                     |

The desk uses Platform's existing `TenantMainLayout`, including top menu, sidebar, app header, workspace and status bar. The frontend is composed into Platform Web on its configured port; this foundation does not start an additional web server. Backend routes are composed through the app's public export in Platform API. No app has a separate login or stores browser tokens.

## Activation and access

1. Seed the Platform app registry so the app is available in Plan Access.
2. Enable `hrms` through Plan Access; use tenant Entitlements only for an explicit exception and confirm effective access.
3. Run tenant migrations to create the employee tables.
4. Run tenant seeding to register overview and employee permissions. The existing admin role receives the initial grants.
5. Assign other roles explicitly through tenant access management.
6. Sign in or reload tenant runtime context, then select HRMS in the app launcher.

The API resolves the active tenant and its isolated database from the authenticated session. It checks live `app_module_settings` activation and the overview permission. Browser tenant/database headers cannot select another tenant. A disabled app is hidden from app switching and its API rejects access. Permission seeds are deterministic and repeatable; rerunning them preserves deliberately disabled permissions and role grants.

## Ownership and database impact

Core remains owner of shared contacts and organization. HRMS owns employment and attendance records. Reuse public Core identity lookups; do not store staff data in Platform auth tables.

The employee module owns `hrms_employees` and `hrms_employee_activity` in each tenant database.
The Department leaf owns `hrms_departments` and `hrms_department_activity`, its API permissions, and repeatable permission seeding. The Designation leaf owns `hrms_designations` and `hrms_designation_activity`, its API permissions, and repeatable permission seeding. Both tenant migrations and seeds exist in HRMS, but Platform does not yet register or invoke them.
Existing tenants need the employee and attendance migrations before they open those modules. These migrations do not alter existing Core or user tables. Permission seeds run only for enabled HRMS tenants and preserve disabled permissions and role grants.

The overview remains read-only and has no business table or CRUD lifecycle.

## Employees

Employees include a required employee code and name, plus email, phone, department, designation, joining date, notes and status.
Department and designation remain text fields until Platform composes both masters and a reviewed tenant data migration converts the values.
Employee codes use uppercase letters, numbers, hyphens and underscores, with a maximum of 40 characters.
Codes are unique within each tenant database.

An employee can optionally map to an existing tenant user through `user_id`.
One user account can map to only one employee. New mappings require active users.
Existing mappings remain editable if the user becomes inactive.
Mapping does not create login credentials or grant roles and permissions.
The tenant user lifecycle checks the public HRMS dependency contract before user deletion.
The database foreign key also blocks deletion of a mapped user.

The Employees list follows the CRM enquiry layout with the shared sortable table, column visibility controls and inline column searches.
It provides global search, status filters, pagination, details and activity history.
New and edit open separate upsert pages. Direct links and browser reload load the selected employee from the API.
The app header provides New employee and form Save/Update actions. Cancel returns to the employee list.
Suspend and restore change employee status. They do not change user account access.
Delete moves an employee to Deleted employees. Restore from that list returns the employee as inactive.
Deleted employees retain their code and user mapping until permanent deletion or a later edit after restoration.
Force delete requires prior deletion and retains activity history.

The module uses `hrms.employee.view`, `hrms.employee.create`, `hrms.employee.update` and `hrms.employee.delete`.
Each API operation checks the matching permission and live HRMS activation.
Employee APIs use eight-character public UUIDs. Integer employee IDs remain database-internal.

## Attendance and overview

Attendance records one daily status per employee and work date. Supported statuses are present, absent, leave, and holiday. Present records may include check-in and check-out times; both must be set together, and check-out must be later. Other statuses do not accept times.

HRMS uses the tenant database calendar date for today's attendance boundary. Database connections use UTC. The API rejects future attendance dates, and the form uses the same UTC date rule. The tenant does not currently have a configurable time zone.

Attendance supports date and status filters, employee search, edit, soft delete/restore, and activity history. Only active employees can receive attendance records. The overview reports active employees, recorded status totals, a seven-day recorded-attendance chart, and recent records. Its “not marked” count compares active employees with today's attendance records; it does not account for shifts or non-working days.

## Organization masters and planned work

Department and Designation API and frontend leaves are implemented, including search, create/edit, detail, status, delete/restore, and activity history. Neither is available in Platform navigation or runtime because Platform composition is pending. Employee lookups and migration of existing text values also remain planned. A read-only review on 2026-10-14 found 11 local development tenant databases with the HRMS employee table, all empty. Production tenants still need a pre-migration inventory. Keep blank values unassigned. Preserve the original text until conversion is verified. Trim values when profiling, report case-insensitive collisions for review, and do not merge distinct values automatically.

Other planned work includes manager relationships, employment end dates, shifts and holidays, one confirmed ZKTeco integration, and leave requests and approvals. ZKTeco integration requires a confirmed device model and protocol. Payroll, recruitment, and other larger HR workflows are out of scope. Employee business records are entered by users and are not seeded.

## Development and verification

Run commands from the repository root; use the root dependency installation and output directories:

```bash
npm run dev:api
npm run dev:web
npm run typecheck -w @codexsun/hrms-api
npm run typecheck -w @codexsun/hrms-web
node tools/check-module-boundaries.mjs hrms-api
node tools/check-module-boundaries.mjs hrms-web
npm run test:tenant-app-foundations
npm run test:e2e:hrms
npm run test:e2e:tenant-app-foundations
```

The E2E command requires the development Platform stack and an isolated `codexsun_dev_` master and tenant database. It verifies login, published launcher metadata, each overview, forged-header isolation, inactive module/permission rejection and repeatable permission seeding. It restores any temporary access changes. Root `npm run check`, `npm run dependencies:check` and `npm run build` remain the release gates.

The employee E2E test uses two temporary `codexsun_dev_hrms_*` databases and removes them after the test.
It checks repeated migrations, permission seeding, user validation, uniqueness races, lifecycle, audit history, isolation and persistence after reconnect.
It also checks module API authentication and permission gates with an injected test context.
It does not replace composed Platform login or browser verification.

## Component documentation

Employee administration, manual attendance, Department and Designation leaves, and the workforce overview.

Preserve one attendance record per employee and date. Distinguish standalone master leaves from completed Platform composition. Keep planned leave and device integration separate from implemented flows.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `attendance`, `department`, `designation`, `employee`, `overview`.
- `web/src/modules`: `attendance`, `department`, `designation`, `employee`, `overview`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs hrms`
- `npm run typecheck -w @codexsun/hrms-api`
- `npm run lint -w @codexsun/hrms-api`
- `npm run build -w @codexsun/hrms-api`
- `npm run typecheck -w @codexsun/hrms-web`
- `npm run lint -w @codexsun/hrms-web`
- `npm run build -w @codexsun/hrms-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/hrms-api`.
- `web`: `@codexsun/hrms-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/hrms-api`: `.`.
- `@codexsun/hrms-web`: `./modules/employee`, `./modules/attendance`, `./modules/department`, `./modules/designation`, `.`, `./modules/overview`, `./modules/overview/gateway`.
