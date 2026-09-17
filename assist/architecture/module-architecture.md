# Module Architecture

## Architecture model

CODEXSUN is a modular monolith. It keeps deployable applications in one repository and one coordinated codebase.

Each business capability is a domain-driven design module. A module owns its behavior, data access, API surface, events, migrations, seeds, and tests.

The repository supports web, desktop, and mobile clients. Clients use public contracts and do not own duplicate business logic.

## Composition model

The composition model is:

```text
provider -> module -> add-on -> app -> platform -> deployable
```

The sequence describes discovery and composition. It does not allow a lower layer to import a higher layer.

| Layer | Responsibility |
| --- | --- |
| Provider | Declares that a module exists and exposes its public registration contract. |
| Module | Owns one business capability and all of its implementation parts. |
| Add-on | Packages one or more optional modules behind a public provider. |
| App | Selects add-ons and composes user-facing product behavior. |
| Platform | Hosts generic applications and platform-owned modules. It does not own product business behavior. |
| Deployable | Selects the applications and add-ons required for a client deployment. |

## Repository structure

```text
apps/
  platform/                 generic platform host
    modules/                platform-owned modules
  <app>/                    independently deployable application
    modules/                app-owned modules
packages/
  framework/                runtime-neutral infrastructure contracts
  ui/                       reusable UI primitives and templates
  <addon>/                  optional reusable add-on and its modules
storage/                    centralized application file storage
.container/                 Docker build and local container runtime files
deployment/                 environment deployment definitions
```

`apps/platform` is the generic holder for selected applications. It owns platform capabilities such as identity, database management, Git repository management, and CLI integration.

An application owns product composition. An application must not recreate central templates, business logic, shared contracts, or UI components that a package already owns.

## Root runtime boundaries

`storage/` is the central file-storage root for all applications. Applications access it through a storage provider and never by an unscoped filesystem path.

`storage/apps/private/<application>/<module>` stores private files. `storage/apps/public/<application>/<module>` stores files that an authorized public delivery adapter may expose.

`.container/` owns Dockerfiles, Compose files, container scripts, image configuration, and local container verification scripts. It does not own application business code.

`deployment/` owns environment-specific deployment definitions, selected applications, selected add-ons, and deployment verification instructions. It does not own reusable application code.

## Module layout

Each module keeps its implementation in one module folder.

```text
modules/<module-name>/
  provider.ts
  routes/
  controller/
  services/
  repository/
  migrations/
  seeders/
  events/
  domain/
  contracts/
  test/
  README.md
```

Add a folder only when the module needs it. Do not move module code into broad technical groupings outside the module folder.

The provider exposes the module's identity, version, dependencies, public contracts, route registration, and event subscriptions. The composition root uses providers to discover and register modules.

Routes, controllers, services, repositories, migrations, seeders, and test suites remain inside their owner module. Modules communicate through public contracts and domain events, not private file imports.

## DDD and event rules

- A module owns its aggregates, value objects, policies, and application services.
- A module owns its schema changes and data compatibility work.
- A module publishes events after its transaction succeeds.
- An event consumer must be idempotent and belong to a named owner module.
- Do not use events to hide synchronous requirements. Use a public application contract when a caller needs an immediate result.
- Do not create a shared domain layer. Extract only stable contracts, infrastructure, design tokens, and UI primitives into packages.

## Package and UI rules

`packages/ui` owns reusable UI primitives, templates, tokens, and shared accessibility behavior. Applications compose those exports and do not copy their own central templates.

Shared business capabilities belong in a named add-on package. An add-on publishes a provider and public contracts. Applications select add-ons through composition only.

`packages/framework` stays runtime-neutral. It must not own product entities, routes, database schemas, authentication policy, or application-specific user interfaces.

## Client boundaries

- Web, desktop, and mobile share public contracts and reusable packages where the target supports them.
- Web uses React and central UI packages.
- Desktop uses React for UI and Tauri with Rust for native capabilities.
- Mobile uses Ionic and Capacitor at this stage.
- Native, browser, and mobile clients must not duplicate domain services or repositories.

## Client deployment selection

Client deployments select only the required applications and add-ons. A deployment may add or remove an app or add-on without changing unrelated modules.

Record each deployment selection, enabled modules, data requirements, and compatibility constraints before production deployment.
