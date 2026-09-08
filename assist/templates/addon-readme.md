# Add-on README Template

Copy this file to `packages/addons/<addon>/README.md`.

```md
# <Add-on Name>

## Purpose

Describe the capability, owner, and applications that use the add-on.

## Identity and compatibility

- Module ID: `<stable-id>`
- Kind: `addon`
- Version: `<semantic-version>`
- Platform range: `<semantic-version-range>`
- Supported targets: `<api|web|desktop|mobile>`

## Ownership

- Entities and records:
- Tables and storage paths:
- Routes and UI paths:
- Configuration and secrets:

## Extension bindings

- Extension points provided:
- Contributions supplied:
- Point version ranges:
- Owner module dependencies:
- Contribution order:

## Public contracts

- API factories:
- Web factories:
- Events published:
- Events consumed:
- Jobs:

## Lifecycle

- Install:
- Activate:
- Upgrade:
- Deactivate:
- Uninstall and data preservation:

## Security

- Required capabilities:
- Network access:
- Filesystem access:
- Database access:

## Verification

- Unit and composition tests:
- Migration and upgrade tests:
- API, browser, desktop, or mobile checks:

## Development records

- [YYYY-MM-DD change](../../../assist/records/<app>/YYYY-MM-DD-change.md)
```
