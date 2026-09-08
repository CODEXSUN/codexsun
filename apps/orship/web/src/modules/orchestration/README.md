# Orchestration Web Module

## Purpose

This module presents live service health, process metrics, runtime logs, and local controls.

## Identity and version

- Module ID: `orchestration`
- Kind: `feature`
- Version: `1.0.0`
- Scope: `app`
- Status: `active`

## Ownership

- Entities and records: browser service snapshots and selected-service state.
- Tables and storage paths: none.
- Routes and UI paths: owns the Orship root workspace.
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
- Browser, desktop, or mobile checks: verify status rows, selection, logs, controls, responsive layout, and the tweak panel.
- Database checks: not applicable.

## Development records

- [2026-09-08 Orship operations foundation](../../../../../../../assist/records/orship/2026-09-08-operations-foundation.md)
