# System API Module

## Purpose

The System module reports the Platform version and the composed module versions. It proves the module contract before Identity starts.

## Identity and version

- Module ID: `system`
- Kind: `core`
- Version: `1.1.0`
- Scope: `platform`
- Status: `active`

## Ownership

- Entities and records: None.
- Tables and storage paths: None.
- Routes and UI paths: `GET /api/system/runtime`.
- Permissions and settings: The first version exposes technical runtime metadata only.

## Public contracts

- API: `system.runtime` version `1.1.0`.
- Events published: None.
- Events consumed: None.
- Dependencies and version ranges: `module-runtime` `^1.0.0`; Platform `^0.1.0`.

## Extension bindings

- Extension points provided: None.
- Contributions supplied: None.
- Point version ranges and order: Not applicable.

## Lifecycle

- Install: No persistence exists in version `1.1.0`.
- Activate: The Platform composition root activates the module.
- Upgrade: Version `1.1.0` adds diagnostics and full manifest discovery without persistence.
- Deactivate: The Platform composition root deactivates the module in reverse order.
- Uninstall: No persistent records require removal.

## Persistence

- Migrations: None.
- Seeds: None.
- Upgrade compatibility: The response contract follows semantic versioning.

## Verification

- Unit and integration tests: Platform composition and lifecycle tests cover registration, response serialization, diagnostics, and activation.
- Browser, desktop, or mobile checks: Not required for the API-only first version.
- Database checks: The module does not use MariaDB.

## Development records

- [2026-09-08 Platform and framework foundation](../../../../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Extensible application and add-on foundation](../../../../../../assist/records/platform/2026-09-08-extension-foundation.md)
- [2026-09-08 Durable module runtime](../../../../../../assist/records/platform/2026-09-08-durable-module-runtime.md)
