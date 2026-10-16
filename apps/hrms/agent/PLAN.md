# CODEXSUN HRMS Plan

**App key:** `hrms`  
**Current state:** Employee management, manual attendance, an attendance-linked overview, and standalone Department and Designation API/UI leaves are implemented. Both masters await Platform composition and employee-reference migration.

## Purpose and scope

HRMS manages employee records, daily attendance, and basic leave workflows for a tenant. It runs inside Platform and uses the existing tenant database, identity, permissions, navigation, and shared UI.

Keep delivery focused on:

- Employee records, optional mapping to an existing tenant user, and essential organization references.
- Reliable manual attendance, followed by one customer-confirmed ZKTeco device integration.
- Leave requests and approvals when the employee and manager relationships are ready.
- An overview that reports only data its owning modules can support accurately.

Payroll, recruitment, expenses, performance, training, biometric collection, and multi-vendor device support are out of scope.

## Existing behavior

| Area                 | Implemented behavior                                                                                                                                                                         | Known gap                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Employees            | Tenant-scoped employee code and profile, optional unique existing-user link, list/search, separate create/edit pages, details, soft-delete lifecycle, and activity history.                  | Department and designation remain free text pending safe employee migration and lookup integration. There is no manager relationship or employment end date. |
| Departments          | Standalone tenant-scoped API and UI leaf with permissions, unique names, validation, lifecycle, and activity history.                                                                        | Platform route, navigation, migration and permission-seed composition are pending.                                                                           |
| Designations         | Standalone tenant-scoped API and UI leaf with permissions, unique names, validation, lifecycle, and activity history.                                                                        | Platform route, navigation, migration and permission-seed composition are pending.                                                                           |
| Attendance           | Manual present, absent, leave, and holiday records; one employee/date key; active-employee selection; date/status filters; soft delete/restore; activity history. Future dates are rejected. | Shifts, work schedules, half days, and device punches are not supported.                                                                                     |
| Overview             | Read-only active employee and recorded daily attendance totals, seven-day chart, recent records, and links to employee/attendance pages.                                                     | “Not marked” means active employees without a record; it does not account for work schedules.                                                                |
| Platform integration | Tenant-scoped migrations, permissions, API composition, and HRMS navigation are in place for current modules.                                                                                | Future modules still need their own routes, permissions, migrations, seeds, and UI composition.                                                              |

The local data review on 2026-10-14 found 11 development tenant databases with the HRMS employee table. All 11 contained zero employee rows, so there were no legacy labels to compare. Production tenant data was not queried and still needs a pre-migration inventory.

The README and this plan must describe shipped behavior accurately. Update documentation when a phase changes that behavior.

## Product requirements

### Employees and organization

- Keep employee code unique within a tenant. Keep the existing tenant-user mapping optional and unique.
- Employee records must not create user accounts, credentials, roles, or permissions.
- Add separate Department and Designation modules. Migrate existing text values without dropping or silently merging data.
- Each master has a required tenant-unique name up to 120 characters, optional description up to 500 characters, and active/inactive status. Names stay reserved while deleted. Use view, create, update, and delete permissions. Restore as inactive; allow permanent deletion only after soft deletion and block it once employee references exist.
- Before converting legacy text, inventory each tenant. Keep blanks unassigned and preserve the source text until verification. Trim values for comparison and report case-insensitive duplicates for review. Do not merge duplicate values without an approved mapping.
- Add an optional manager relationship using employee public IDs. Reject missing managers, self-reporting, and reporting cycles.
- Define employment status and end-date transitions before adding offboarding behavior. Preserve employee history and user accounts.
- Device badge mappings and future shift assignments must end when employment ends; historical records remain available.

### Attendance and overview

- Keep manual attendance usable without a device. Use the tenant database calendar date for today's boundary; database connections currently use UTC because tenants have no configurable time zone. Enforce status-specific fields and valid check-in/out order.
- Reject future attendance dates. Retain one attendance result per employee and work date, including deleted records, unless restore or replacement is handled explicitly.
- Record who changed attendance, when, why, and from which source. A device replay must not silently overwrite a reviewed manual result.
- Add a half-day only after its effect on hours and reporting is defined.
- Add shifts and holidays only when scheduled-versus-unmarked reporting is required. Until then, label current totals as recorded attendance and do not imply a reliable work schedule.
- Keep the overview read-only and source each metric from the module that owns its records.

### ZKTeco device integration

- Gate implementation on a confirmed device model, firmware, site network, device time zone, protocol, and connector or SDK terms.
- Support one confirmed model first. Run the connector on the tenant LAN or approved middleware and send logs over authenticated TLS.
- Bind server-side credentials to one tenant and registered device. Never trust a tenant identifier from a device payload or expose credentials in browser code or logs.
- Keep immutable punch logs with source identity, device time, time zone, receive time, and a stable deduplication key. Acknowledge only after durable storage; support retry and replay.
- Map device badge IDs to employees through effective-dated, reviewed mappings. Quarantine unmapped or ambiguous punches; never match by name.
- Do not collect biometric templates, fingerprints, or face images. Define retention and export permissions before production rollout.

### Leave

- Add leave types and requests with backend date, overlap, partial-day, and status-transition validation.
- Scope employee access to their own requests and manager approval to authorized reporting relationships.
- Reflect approved leave in attendance and overview without creating duplicate leave records.
- Add a balance ledger only if an agreed leave policy requires balance enforcement.

## Delivery phases

1. **Attendance correctness:** close validation and reporting gaps in the existing manual workflow.
2. **Employee foundation:** profile existing text values, compose Department and Designation, migrate references, then add manager relationships and employment lifecycle rules.
3. **Scheduled attendance:** add shifts and holidays only to support agreed scheduling and missing-attendance calculations.
4. **ZKTeco integration:** implement one device model after the customer and protocol gate is satisfied.
5. **Leave:** add request and approval workflows after manager relationships and access rules are ready.

Every phase must use module-owned backend and frontend leaves, tenant migrations, repeatable permission seeds, authenticated typed routes, audit history, and Platform composition. Do not expose an unfinished module in navigation.

## Completion criteria

A phase is complete when its migration and seeds safely rerun, API permissions and tenant isolation pass, composed Platform flows work, activity history is available where records change, and the README matches shipped behavior. Verify both allowed and denied access.
