# CODEXSUN Framework and Platform Plan

## Planning Status

This record combines the approved plan with completion status.

Do not start a planned task without user confirmation in `task.md`.

## Goal

Build CODEXSUN as a modular monolith that can compose web, desktop, and mobile applications from module-owned capabilities.

The platform is a generic holder. Product behavior belongs to a named application or add-on module.

## Current Baseline

The released foundation is `v-1.0.4`.

- [x] Root npm workspace, root dependency directory, root build directory, and root Turbo cache rules exist.
- [x] Platform API and web hosts exist.
- [x] The Framework package has a small provider engine.
- [x] Platform Core composes environment, database configuration, database, and settings providers.
- [x] The Platform System module exposes a health route.
- [x] The UI package provides the first Tailwind and shadcn-compatible MDI shell.
- [x] Root environment, startup preflight, versioning, changelog, Git, lint, and layout rules exist.
- [x] Framework lifecycle, provider dependency validation, public contracts, and tests are complete.
- [ ] Persistence adapters, jobs, and client hosts remain incomplete.

## Required Direction

```text
framework contracts
        |
platform providers and runtime adapters
        |
module providers and module-owned behavior
        |
add-ons and application composition
        |
web, desktop, and mobile hosts
        |
client-selected deployable composition
```

The required composition path stays:

```text
provider -> module -> add-on -> app -> platform -> deployable
```

Lower layers must not import higher layers. A module must not import another module's private files.

## Framework Concepts

### Framework scope

`packages/framework` is runtime-neutral. It defines stable contracts only.

The Framework must own these concepts:

1. Provider identity, registration, dependency declaration, and lifecycle state.
2. Module manifest validation and dependency ordering.
3. Application service and event contract types.
4. Typed result, error, pagination, and transaction boundary contracts.
5. Test harness contracts for provider, module, and lifecycle tests.

The Framework must not own these concepts:

- Fastify routes or HTTP transport.
- React, Tauri, Ionic, or Capacitor user interfaces.
- Product aggregates, product authorization rules, or product workflows.
- SQL tables, Kysely queries, database drivers, or migrations.
- Client deployment selection.

### Provider contract

Every provider must declare a stable ID, owner, version, dependencies, and registration action.

```text
Provider manifest
  -> identity
  -> declared dependencies
  -> public contracts
  -> lifecycle hooks
  -> registration result
```

A provider proves module presence. It does not contain the module's business behavior.

### Module contract

Every module owns its provider, routes, controllers, services, repositories, migrations, seeders, events, contracts, tests, and README when those parts are needed.

```text
modules/<module>/
  provider.ts
  domain/
  contracts/
  services/
  repository/
  controller/
  routes/
  migrations/
  seeders/
  events/
  test/
  README.md
```

The module README records ownership, public API, data, events, dependencies, storage, and checks.

### Event contract

Events are public facts published after a successful transaction.

```text
application service
  -> transaction commits
  -> event is recorded
  -> queue or synchronous dispatcher delivers it
  -> named consumer handles it idempotently
```

Events do not replace an immediate request and response contract.

### Configuration contract

The root `.env` provides shared defaults. Each host can override safe host values through its own `.app.env`.

Every runtime configuration value requires Zod validation before a host starts.

## Platform Concepts

### Platform scope

`apps/platform` composes generic platform capabilities. It does not become a shared product domain.

The Platform will host these module groups:

| Group      | Initial module candidates             | Scope                                                       |
| ---------- | ------------------------------------- | ----------------------------------------------------------- |
| Runtime    | Environment, Settings, Health         | Provider composition and host health.                       |
| Data       | Database Management, Migration Runner | Database selection, connection health, migration execution. |
| Identity   | Users, Roles, Sessions, Access Policy | Generic authentication and authorization.                   |
| Workspace  | Git Repository Management, CLI        | Local repository and command boundaries.                    |
| Operations | Audit, Metrics, Logs, Job Monitoring  | Support evidence and runtime visibility.                    |
| Storage    | Storage Provider, File Policy         | Scoped file access and retention rules.                     |

Product applications may consume these public contracts. They must keep product behavior in their own modules.

### Platform composition

```text
Platform API composition root
  -> Platform Core provider
  -> selected platform module providers
  -> selected add-on providers
  -> Fastify routes and event delivery adapters

Platform web composition root
  -> public API contracts
  -> packages/ui exports
  -> application shell and route composition
```

## Phases

### Phase 0. Released foundation

Status: complete.

- [x] F-001 Root workspace, toolchain, and source-layout rules.
- [x] F-002 Initial provider engine and Platform Core composition.
- [x] F-003 Platform System health module and web shell.
- [x] F-004 Environment, startup, versioning, Git, and ignore policies.

### Phase 1. Framework kernel

Status: complete.

- [x] F-101 Define a typed provider manifest and provider lifecycle.
- [x] F-102 Define module manifest, dependency ordering, and cycle rejection.
- [x] F-103 Define public result, error, pagination, and event envelope contracts.
- [x] F-104 Define lifecycle test helpers and Framework contract tests.
- [x] F-105 Document Framework extension and compatibility rules.

Exit criteria:

- [x] A provider can declare dependencies and lifecycle hooks.
- [x] Invalid or cyclic provider graphs fail before host startup.
- [x] Framework remains independent of HTTP, UI, database drivers, and product domains.

### Phase 2. Platform runtime and configuration

Status: complete.

- [x] P-201 Create a Platform Runtime module registry and composition plan.
- [x] P-202 Add typed runtime configuration schemas for API, web, desktop, and mobile hosts.
- [x] P-203 Add safe provider readiness and health reporting.
- [x] P-204 Add a module enablement policy for deployable profiles.

Exit criteria:

- [x] A host starts only with validated configuration and valid provider dependencies.
- [x] Health reports provider status without exposing secrets.
- [x] A deployable profile selects enabled providers explicitly.

### Phase 3. Data foundation

Status: complete.

- [x] D-301 Define repository and transaction contracts in the Framework.
- [x] D-302 Add the Kysely adapter behind Platform Data providers.
- [x] D-303 Add SQLite support for local tests and isolated runtime use.
- [x] D-304 Add MariaDB support for deployed service data.
- [x] D-305 Create migration, seeder, compatibility, backup, and restore rules.

Exit criteria:

- [x] A module owns its migrations and seeders.
- [x] SQLite and MariaDB use the same repository contract where both apply.
- [x] Migration status and rollback limits are recorded before deployment.

### Phase 4. Identity and authorization

Status: complete.

- [x] I-401 Define identity, session, role, permission, and actor contracts.
- [x] I-402 Create the Platform Identity module with module-owned data and routes.
- [x] I-403 Add API authentication and authorization boundaries.
- [x] I-404 Add web session handling through public contracts.
- [x] I-405 Define tenant policy only after the first tenant requirement is confirmed.

Exit criteria:

- [x] Protected routes require a verified actor and permission.
- [x] Product modules do not manage credentials or copy identity logic.
- [x] Identity tests cover unauthenticated, unauthorized, and authorized cases.

### Phase 5. Module delivery standard

Status: complete.

- [x] M-501 Create a module generator template from Assist rules.
- [x] M-502 Add static checks for provider ownership and private-import violations.
- [x] M-503 Add module contract, service, repository, route, and event test conventions.
- [x] M-504 Add a reference Platform Settings module as the first full module.

Exit criteria:

- [x] A new module has one owned folder and one provider.
- [x] A module exposes only documented contracts.
- [x] The reference module contains no cross-module private imports.

### Phase 6. Design system foundation

Status: complete.

- [x] U-601 Define semantic theme tokens and a theme provider in `packages/ui`.
- [x] U-602 Define the public component registry and variant metadata contract.
- [x] U-603 Complete shadcn-compatible base components with documented defaults and variants.
- [x] U-604 Complete reusable blocks, pages, templates, and the default MDI composition.
- [x] U-605 Wire the Platform web default template from public `packages/ui` exports.
- [x] U-606 Build UIUX as a dynamic gallery with a temporary Tweak panel.

Exit criteria:

- [x] Applications select approved variants through public package exports.
- [x] Every published item has a default, variants, states, and accessibility notes.
- [x] Platform web visibly uses the default MDI template.

### Phase 7. API, contracts, and web application shell

Status: complete.

- [x] A-601 Create a contracts package for API schemas and response envelopes.
- [x] A-602 Centralize provider-resolved Fastify route composition.
- [x] A-603 Add request validation, error mapping, and API version policy.
- [x] A-604 Reuse the completed Phase 6 public UI package in application composition.
- [x] A-605 Add Platform web views for health and module visibility. Settings remains permission-gated.
- [x] A-606 Add Playwright browser checks for the first supported user flow. The source requires the declared root Playwright dependency before execution.

Exit criteria:

- [x] Web code imports only public package exports and API contracts.
- [x] API routes call module services rather than repositories directly.
- [x] A Playwright test proves a visible web flow.

### Phase 8. Events and background jobs

Status: complete.

- [x] E-701 Add the optional Redis runtime scaffold and configuration contract. Database-backed delivery remains selected.
- [x] E-702 Add a database-backed outbox contract, persistence policy, and worker claim policy.
- [x] E-703 Add the database worker lifecycle, retry, and failed-record recovery policy. Defer BullMQ until a Redis deployment is selected.
- [x] E-704 Add idempotent consumer records for database-backed event delivery.
- [x] E-705 Add outbox state counts and failed-record observability rules.

Exit criteria:

- [x] Database-backed jobs have a named module owner and retry policy.
- [x] Consumers are idempotent.
- [x] Failed jobs have an operator-visible recovery path.

### Phase 9. Operations, storage, and deployment

Status: complete.

- [x] O-801 Complete the scoped Storage Provider and local adapter.
- [x] O-802 Add audit, structured operation logging, outbox state metrics, and readiness rules.
- [x] O-803 Add Docker Compose definitions under `.container`.
- [x] O-804 Update the Aaran deployment profile for the selected composition.
- [x] O-805 Add backup, restore, secret, and production verification runbooks.

Exit criteria:

- [x] Storage is module-scoped and tested for traversal rejection.
- [ ] Docker checks prove the selected composition starts. The Compose model validates, but the local Docker Desktop Linux daemon is unavailable.
- [x] A deployment profile records selected apps, add-ons, data, ports, and rollback.

### Phase 10. Desktop host

Status: complete.

- [x] C-901 Create a Tauri and Rust desktop host under Platform.
- [x] C-902 Define the `desktop_runtime` Rust command and default capability policy.
- [x] C-903 Reuse public API contracts and `packages/ui` exports.
- [x] C-904 Add desktop type, native-boundary, and unbundled binary build checks.

Exit criteria:

- [x] Desktop code does not duplicate API services or repositories.
- [x] Rust owns native operating-system access.
- [x] Desktop output writes only under `dist/<app>/desktop/`.

### Phase 11. Mobile host

Status: complete.

- [x] C-1001 Create an Ionic and Capacitor mobile host under Platform.
- [x] C-1002 Define the initial mobile navigation and online-only API policy.
- [x] C-1003 Reuse public API contracts and target-safe packages.
- [x] C-1004 Add Capacitor configuration and web build checks. Native SDK synchronization remains environment-specific.

Exit criteria:

- [x] Mobile code does not import Tauri or desktop-only packages.
- [x] Mobile output writes only under `dist/<app>/mobile/`.
- [ ] A device or emulator proves the selected user flow. No Android or iOS SDK is selected locally.

### Phase 12. Client deployment selection

Status: complete for profile selection. Deployment execution is deferred.

- [x] R-1101 Create the Aaran single-tenant deployment profile.
- [x] R-1102 Select Platform hosts, providers, infrastructure, and client targets.
- [ ] R-1103 Verify data compatibility, backups, Docker composition, and production behavior. Deferred by profile-only scope.

Exit criteria:

- [x] The profile can add or remove applications without changing module ownership.
- [x] The profile records rollback steps and required release evidence.

## Implementation Order

Implement phases in this order:

1. Phase 1 Framework kernel.
2. Phase 2 Platform runtime and configuration.
3. Phase 3 Data foundation.
4. Phase 4 Identity and authorization.
5. Phase 5 Module delivery standard.
6. Phase 6 Design system foundation.
7. Phase 7 API, contracts, and web shell.
8. Phase 8 Events and background jobs.
9. Phase 9 Operations, storage, and deployment.
10. Phases 10 and 11 desktop and mobile in parallel after public contracts are stable.
11. Phase 12 client deployment selection after the client requirement is known.

## Application Rollout

Build application hosts only after Framework, Platform runtime, public contracts, and the design-system foundation are ready.

1. Zetro: governed AI planning, task, worker, review, test, and deployment workflows.
2. Docs: MD and MDX authoring, database index, composed articles, backlinks, and Obsidian-style graph connections.
3. Orship: deploy, monitoring, Docker, and database-maintenance workflows.
4. UIUX: dynamic gallery for the public UI registry, variants, blocks, pages, and templates.

Each application requires its own provider, API and web host plan, `.app.env` examples, module register entry, public contracts, Playwright flow, Docker checks where selected, and deployment profile.

## Approval Gate

Phase 5 and Phase 6 are complete.

The next implementation task requires a selected product module or a later deployment verification request.

Before work starts, confirm the exact task ID, scope, data impact, and target verification level in `task.md`.
