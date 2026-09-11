# Orchestration Web Module

## Purpose

This module presents live service health, process metrics, runtime logs, and local controls.

## Identity and version

- Module ID: `orchestration`
- Kind: `feature`
- Version: `1.3.0`
- Scope: `app`
- Status: `active`

## Ownership

- Entities and records: browser service snapshots, application-level reports, independent component logs, deployment-target settings, read-only deployment evidence, allowlisted Docker workload state, and in-workspace list/show navigation history.
- Tables and storage paths: none.
- Routes and UI paths: owns application service cards, Overview, Failures and Deployment console tabs, independent API/Web logs, deployment target settings, manual verification capture, immutable deployment history, local labelled Docker workload controls, and the shared prerequisites configuration and source page.
- Permissions and settings: respects API-provided `controllable` and `protected` flags.

## Public contracts

- API: consumes the versioned `@codexsun/orship-contracts` schemas.
- Events published: none.
- Events consumed: none.
- Dependencies and version ranges: shared UI `^0.1.0` and Orship contracts `^0.1.0`.

## Extension bindings

- Extension points provided: none.
- Contributions supplied: MDI application identity and operations navigation.
- Point version ranges and order: shared MDI layout `^0.1.0`.

## Lifecycle

- Install: the deployment profile includes the web component.
- Activate: TanStack Query starts live health and log refresh.
- Upgrade: preserve the service ID as the browser selection key.
- Deactivate: React Query cancels observers during unmount.
- Uninstall: no browser-owned service data needs removal.

## Persistence

- Migrations: none.
- Seeds: none.
- Upgrade compatibility: no browser persistence in version `1.0.0`.

## Verification

- Unit and integration tests: covered by strict contract parsing and production build.
- Browser, desktop, or mobile checks: verify whole-card application selection, combined API/web metrics and controls, independent component log tabs with refresh and copy, local Docker command previews, real repository and file evidence, manual record states, terminal-output history, back and forward history, and responsive layout.
- Database checks: not applicable.

## Development records

- [2026-09-08 Orship operations foundation](../../../../../../../assist/records/orship/2026-09-08-operations-foundation.md)
- [2026-09-08 Grouped service operations](../../../../../../../assist/records/orship/2026-09-08-grouped-service-operations.md)
- [2026-09-09 Service desk](../../../../../../../assist/records/orship/2026-09-09-service-desk.md)
- [2026-09-09 Failure center](../../../../../../../assist/records/orship/2026-09-09-failure-center.md)
- [2026-09-09 Local deployment evidence desk](../../../../../../../assist/records/orship/2026-09-09-local-deployment-evidence-desk.md)
- [2026-09-11 Shared prerequisites](../../../../../../../assist/records/orship/2026-09-11-shared-prerequisites.md)
