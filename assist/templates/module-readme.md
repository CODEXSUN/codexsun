# Module README Template

Copy this file into each backend and frontend module as `README.md`.

```md
# <Module Name>

## Purpose

Describe the module capability and its business owner.

## Identity and version

- Module ID: `<stable-id>`
- Kind: `<core|feature|addon|adapter>`
- Version: `<semantic-version>`
- Scope: `<platform|app|tenant|integration>`
- Status: `<planned|active|deprecated>`

## Ownership

- Entities and records:
- Tables and storage paths:
- Routes and UI paths:
- Permissions and settings:
- Shared UI: List the public `@codexsun/ui` exports used. Do not own a reusable UI copy.

## Public contracts

- API:
- Events published:
- Events consumed:
- Dependencies and version ranges:

## Extension bindings

- Extension points provided:
- Contributions supplied:
- Point version ranges and order:

## Lifecycle

- Install:
- Activate:
- Upgrade:
- Deactivate:
- Uninstall:

## Persistence

- Migrations:
- Seeds:
- Upgrade compatibility:

## Verification

- Unit and integration tests:
- Browser, desktop, or mobile checks:
- Database checks:

## Development records

- [YYYY-MM-DD change](../../../../../../assist/records/<app>/YYYY-MM-DD-change.md)
```
