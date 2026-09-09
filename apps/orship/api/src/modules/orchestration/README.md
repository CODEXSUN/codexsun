# Orchestration API Module

## Purpose

This module observes and controls local CODEXSUN deployment components.

## Identity and version

- Module ID: `orchestration`
- Kind: `feature`
- Version: `1.2.0`
- Scope: `app`
- Status: `active`

## Ownership

- Entities and records: live service snapshots, one local deployment target configuration, and append-only Platform deployment evidence. Snapshots are observations and are not stored as business records.
- Tables and storage paths: no tables. Reads concise component files from `storage/app/private/runtime/logs`; structured diagnostics and failure-only files remain owned by root preflight. Stores non-secret target details in `storage/app/private/orship/cloud-target.json` and immutable evidence in `storage/app/private/orship/deployments/platform/records.jsonl`.
- Routes and UI paths: owns `/api/orship/v1/services`, `/api/orship/v1/failures`, service logs, service actions, `/api/orship/v1/cloud-target`, and the Platform deployment evidence routes.
- Permissions and settings: local controls need `ORSHIP_CONTROL_ENABLED=true`, a loopback request, and repository process ownership.

## Public contracts

- API: list services, read service logs and failures, start or stop a service, inspect local read-only deployment evidence, and append manually verified deployment records. `orship.services` is version `1.1.0`; `orship.deployments` is version `1.0.0`.
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
- Upgrade: keeps the `orship.services` and `orship.deployments` contracts compatible within version `1.x`.
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
