# Orchestration API Module

## Purpose

This module observes and controls local CODEXSUN deployment components.

## Identity and version

- Module ID: `orchestration`
- Kind: `feature`
- Version: `1.3.0`
- Scope: `app`
- Status: `active`

## Ownership

- Entities and records: live service snapshots, one local deployment target configuration, append-only Platform deployment evidence, and allowlisted local Docker workload actions. Snapshots are observations and are not stored as business records.
- Tables and storage paths: no application database. Reads concise component files from `storage/app/private/runtime/logs`; structured diagnostics and failure-only files remain owned by root preflight. Stores non-secret target details in `storage/app/private/orship/cloud-target.json`, immutable evidence in `storage/app/private/orship/deployments/platform/records.jsonl`, and Docker action memory in private SQLite and JSONL files.
- Routes and UI paths: owns `/api/orship/v1/services`, `/api/orship/v1/failures`, service logs, service actions, `/api/orship/v1/cloud-target`, prerequisite health, settings, and allowlisted source routes, Platform deployment evidence routes, and allowlisted Docker workload routes.
- Permissions and settings: local controls need `ORSHIP_CONTROL_ENABLED=true`, a loopback request, and repository process ownership.

## Public contracts

- API: list services, read service logs and failures, start or stop a service, inspect local read-only deployment evidence, append manually verified deployment records, observe shared prerequisite health, save write-only prerequisite configuration, edit allowlisted prerequisite source files, and control labelled local Docker workloads. `orship.services` is version `1.1.0`; `orship.deployments` and `orship.docker` are version `1.0.0`.
- Events published: none.
- Events consumed: none.
- Dependencies and version ranges: CODEXSUN Framework `^0.1.0` and Runtime Holder `^0.1.0`.

## Extension bindings

- Extension points provided: none.
- Contributions supplied: none.
- Point version ranges and order: none.

## Lifecycle

- Install: validates the module manifest during API composition.
- Activate: registers the operations routes.
- Upgrade: keeps the `orship.services`, `orship.deployments`, and `orship.docker` contracts compatible within version `1.x`.
- Deactivate: Fastify closes the routes with the application.
- Uninstall: preserves shared runtime logs.

## Persistence

- Migrations: none.
- Seeds: none.
- Upgrade compatibility: response contracts use explicit schema versions and nullable unavailable metrics.

## Verification

- Unit and integration tests: service summary, action delegation, and protected control behavior.
- Browser, desktop, or mobile checks: browser verification is required after UI changes.
- Database checks: not applicable.

## Development records

- [2026-09-08 Orship operations foundation](../../../../../../../assist/records/orship/2026-09-08-operations-foundation.md)
- [2026-09-09 Failure center](../../../../../../../assist/records/orship/2026-09-09-failure-center.md)
- [2026-09-09 Local deployment evidence desk](../../../../../../../assist/records/orship/2026-09-09-local-deployment-evidence-desk.md)
- [2026-09-11 Shared prerequisites](../../../../../../../assist/records/orship/2026-09-11-shared-prerequisites.md)
