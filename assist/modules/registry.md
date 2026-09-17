# Module Registry

## Registration rule

Add a registry entry before a module becomes available to an application or add-on.

Each entry must identify the module provider, owner, public contracts, dependencies, events, storage namespace, migrations, client targets, and test location.

## Entry format

| Field        | Required value                                |
| ------------ | --------------------------------------------- |
| Module       | Stable module identifier.                     |
| Owner        | Owning application or add-on.                 |
| Provider     | Public provider export path.                  |
| Contracts    | Public HTTP, TypeScript, and event contracts. |
| Dependencies | Required providers and infrastructure.        |
| Storage      | Module storage namespace or none.             |
| Data         | Tables, migrations, and seeders or none.      |
| Events       | Published and consumed events or none.        |
| Tests        | Owner test path and required checks.          |
| Status       | Planned, active, deprecated, or removed.      |

Do not list a module until its provider and README exist.

## Registered Modules

| Module          | Owner        | Provider          | Contracts                     | Storage | Data | Events | Tests            | Status |
| --------------- | ------------ | ----------------- | ----------------------------- | ------- | ---- | ------ | ---------------- | ------ |
| Platform System | Platform API | `platform.system` | `GET /api/v1/platform/health` | None    | None | None   | API health check | Active |
