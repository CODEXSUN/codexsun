# System Web Module

## Purpose

The System web module shows the active Platform version, modules, versions, and capabilities.

## Identity and version

- Module ID: `system`
- Version: `1.0.0`
- Scope: `platform`
- Status: `active`

## Ownership

- Entities and records: None.
- Tables and storage paths: None.
- Routes and UI paths: `/system`.
- Permissions and settings: The first version shows technical metadata only.

## Public contracts

- API: Consumes `system.runtime` version `1.0.0`.
- Events published: None.
- Events consumed: None.
- Dependencies and version ranges: Platform web `^0.1.0`.

## Lifecycle

- Install: The web composition root registers its route and navigation item.
- Activate: TanStack Router activates the route when the user opens it.
- Upgrade: The module follows semantic versions for API changes.
- Deactivate: Removing the module removes its route and navigation item.
- Uninstall: The module owns no browser persistence.

## Persistence

- Migrations: None.
- Seeds: None.
- Upgrade compatibility: The service validates API responses with Zod.

## Verification

- Unit and integration tests: Web composition tests cover route and navigation validation.
- Browser, desktop, or mobile checks: Browser verification is required after UI changes.
- Database checks: The API owns readiness checks.

## Interface topology

The module owns the System workspace topology. It identifies the summary banner,
module list, module cards, and runtime error state.

## Development records

- [2026-09-08 Platform and framework foundation](../../../../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
