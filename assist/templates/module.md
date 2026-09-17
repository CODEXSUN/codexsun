# Module Template

Create this template with:

```text
npm.cmd run module:create -- --target apps/<app>/api/src/modules --name <module-name> --id <owner>.<module-name> --owner apps/<app>/api
```

The command refuses an existing target and paths outside `apps/` or `packages/`.
It creates the provider, README, provider test placeholder, and owned artifact
folders. Add only the folders that the module needs after generation.

## Purpose

State the business capability and its owner.

## Provider

State the provider identifier, version, dependencies, registration hooks, and public exports.

## Contracts And Events

List HTTP, TypeScript, and event contracts. State published and consumed events.

## Data And Storage

List tables, migrations, seeders, storage namespace, retention, and tenant behavior.

## Clients And Tests

List web, desktop, or mobile use. List unit, integration, browser, and Docker checks.
