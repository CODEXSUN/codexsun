# Golden Rules

These rules are mandatory for every application, package, module, and agent.

## Modular monolith

- Run selected modules in one application runtime. Do not create one service per module.
- Keep each module isolated in source, contracts, data ownership, tests, and documentation.
- Let an application composition root register modules. It must not contain business CRUD behavior.
- Use modules through intentional public exports, injected dependencies, fixed lookup APIs, or approved events.
- Never import a sibling module's private files.
- Never write directly to another module's tables or storage records.

## DDD ownership

- One business entity belongs to one backend leaf module and one matching frontend leaf module.
- The owning module defines its own fields, validation, policies, use cases, persistence, routes, UI, tests, and documentation.
- Keep application services, domain policies, and repositories inside the owning module.
- Put only stable technical contracts in `packages/framework` or `packages/platform-core`.
- Shared packages must not know business fields, workflows, tables, forms, lists, or lifecycle rules.
- Do not create generic CRUD engines, metadata-driven screens, dynamic table repositories, or path-based service helpers.

## Module lifecycle and versions

- Give every module a stable module identifier and a semantic version.
- Never encode a version, revision, or instance number in a module identifier.
- Declare module dependencies with compatible version ranges in the module manifest.
- A module manifest must state its scope, capabilities, dependencies, public contracts, and lifecycle functions.
- A module manifest must state its kind, extension points, and extension contributions.
- Parse external manifests as unknown input and reject unknown fields before registration.
- Treat each add-on as a versioned module that targets named extension points.
- Reject missing, incompatible, duplicate, or undeclared extension bindings before startup.
- Support install, activate, upgrade, deactivate, and uninstall decisions through explicit module behavior.
- Keep migrations additive and ordered. Make seeds repeatable and owned by the module.
- Preserve existing record identity during an upgrade. Do not recreate records to imitate a fresh installation.
- Document every public contract or migration change in the module README and app catalog.

## Backend modules

- Place application-owned business backend code in `apps/<app>/api/src/modules/<module>/`.
- Place an independently shipped reusable add-on in `packages/addons/<addon>` only after its public contract is stable.
- Keep the API source root thin. It may contain startup and composition only.
- Use module-prefixed filenames. Keep public exports in the module `index.ts`.
- Validate every external input with strict Zod schemas at the route boundary.
- Keep routes thin. Routes call module services. Services enforce business rules. Repositories own only module persistence.
- Add events, workers, sync, migrations, and seeds only when the module has real behavior for them.
- Do not add empty, placeholder, wrapper, alias, or borrowed role files.

## Frontend modules

- Place business frontend code only in `apps/<app>/web/src/modules/<module>/`.
- Keep module API calls in `{module}.services.ts` and query behavior in `{module}.hooks.ts`.
- Keep executable validation in `{module}.schema.ts` and module-specific types in `{module}.types.ts`.
- Keep forms, lists, details, and workspaces as distinct implementations with distinct responsibilities.
- Use shared design tokens and UI primitives. Keep business forms, views, and workflows in the owning module.
- Provide loading, empty, error, permission, and success states for user-facing module flows.

## Documentation

- Treat documentation as part of every module and feature change.
- Add or update `assist/records/<app>` with the outcome, references, bindings, parallel work, decisions, verification, and follow-up work.
- Create `apps/<app>/README.md` from the application template when an application is added.
- Keep application commands, ports, configuration, health, shutdown, verification, and module catalog links current.
- Create `README.md` inside every module before adding module code.
- Create or update `assist/modules/<app>.md` in the same change. It must link to each module README.
- The module README is the authoritative module document. The app catalog records discovery and composition only.
- Document purpose, owner, version, entities, tables, routes, dependencies, events, jobs, settings, permissions, lifecycle, tests, and migration behavior.
- Update documentation in the same patch as a module contract, schema, route, event, job, setting, or ownership change.
- Do not leave an undocumented module, public export, route, worker, migration, or storage contract.
- Run the application and module documentation gates before handoff.
- Do not mark a feature complete when its owner README or development record is stale.

## Size and quality limits

- Keep every authored source and documentation file at 700 physical lines or fewer.
- Split a file by a real responsibility before it reaches the limit.
- Do not split code into wrappers, aliases, or files with no independent behavior.
- Keep generated files out of source and documentation folders.
- Keep each module independently type-checkable and testable.
- Run Prettier and ESLint through root npm scripts before completing code work.
- Treat a build warning as a failed build. Fix its cause before handoff.
- Keep production JavaScript chunks at or below 400 KB. Split features or dependencies instead of raising the budget.

## Required audit

Before finalizing module work, verify all of the following:

1. The module owns every business behavior that it implements.
2. The composition root contains registration and lifecycle composition only.
3. No private cross-module import or direct cross-module database write exists.
4. No generic CRUD or metadata engine owns module behavior.
5. Required module documentation and app catalog entries are current.
6. No authored file exceeds 700 lines.
7. Focused tests, type checks, builds, and relevant persistence checks pass.
8. Any unavailable database, browser, desktop, mobile, or E2E check is reported as not run.
