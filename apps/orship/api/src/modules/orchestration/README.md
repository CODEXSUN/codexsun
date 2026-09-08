# Orchestration API Module

## Purpose

This module observes and controls local CODEXSUN deployment components.

## Identity and version

- Module ID: `orchestration`
- Kind: `feature`
- Version: `1.0.0`
- Scope: `app`
- Status: `active`

## Ownership

- Entities and records: live service snapshots. These are observations and are not stored as business records.
- Tables and storage paths: no tables. Reads `deployments/catalog.json` and `storage/app/private/runtime/logs`.
- Routes and UI paths: owns `/api/orship/v1/services`, service logs, and service actions.
- Permissions and settings: local controls need `ORSHIP_CONTROL_ENABLED=true`, a loopback request, and repository process ownership.

## Public contracts

- API: list services, read service logs, and start or stop a service.
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
- Upgrade: keeps the `orship.services` contract compatible within version `1.x`.
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
