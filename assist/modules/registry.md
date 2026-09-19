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

| Module                | Owner        | Provider                | Contracts                                                | Storage                        | Data                                  | Events | Tests                      | Status |
| --------------------- | ------------ | ----------------------- | -------------------------------------------------------- | ------------------------------ | ------------------------------------- | ------ | -------------------------- | ------ |
| UIUX Gallery          | UIUX Web     | `uiux.web.gallery`      | Browser gallery routes and shared UI specimens           | None                           | None                                  | None   | Gallery module contract test | Active |
| Platform System       | Platform API | `platform.system`       | `GET /api/v1/platform/health`                            | None                           | None                                  | None   | API health check           | Active |
| Platform Identity API | Platform API | `platform.identity`     | Actor, authorization, and single-tenant policy contracts | None                           | `identity.001`, `identity.seed.001`   | None   | Identity API tests         | Active |
| Platform Settings     | Platform API | `platform.settings`     | `GET /api/v1/platform/settings`                          | None                           | `settings.001`, `settings.seed.001`   | None   | Settings API module tests  | Active |
| Platform Operations   | Platform API | `platform.operations`   | Audit, storage, and outbox contracts                     | Module-scoped storage          | `operations.001`                      | `platform.operation-recorded.v1` | Operations module tests | Active |
| Platform Identity Web | Platform Web | `platform.web.identity` | Public `Actor` contract                                  | None                           | None                                  | None   | Identity session web tests | Active |
| Docs Catalog API      | Docs API     | `docs.catalog`          | `GET /api/docs/v1/health`                                | None                           | SQLite `docs-index.001` derived index | None   | Docs API module tests      | Active |
| Zetro Foundation      | Zetro API    | `zetro.foundation`      | `GET /api/zetro/v1/health`                               | None                           | None                                  | None   | Zetro foundation tests     | Active |
| Zetro Storage         | Zetro API    | `zetro.storage`         | SQLite readiness contract                                 | Zetro private storage          | Zetro SQLite readiness data           | None   | Zetro storage tests        | Active |
