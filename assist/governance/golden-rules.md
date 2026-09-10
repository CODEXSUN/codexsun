# Golden Rules

These rules are mandatory for every application, package, module, and agent.

## Modular monolith

- Run selected modules in one application runtime. Do not create one service per module.
- Keep each module isolated in source, contracts, data ownership, tests, and documentation.
- Let an application composition root register modules. It must not contain business CRUD behavior.
- Use modules through intentional public exports, injected dependencies, fixed lookup APIs, or approved events.
- Never import a sibling module's private files.
- Never write directly to another module's tables or storage records.
- Import another module only through its public `index.ts` and a declared manifest dependency.

## Event-driven module collaboration

- Use synchronous calls inside one module. Use a declared public contract or a versioned event across modules.
- Declare every published and consumed event in the module manifest before composition.
- Publish domain events after the owning use case succeeds. When database durability is required, write an outbox record in the same transaction.
- Keep event payload schemas, handlers, idempotency rules, retry behavior, and failure policy in the owning module.
- Do not use events to hide request-response work that requires an immediate result.
- The in-process event bus is same-process delivery. Do not claim durable delivery until an outbox and idempotent inbox exist.

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
- Keep migration and seed files inside the module folder that owns the affected tables and records.
- Never edit an applied migration or seed checksum. Add a new ordered declaration for the next module version.
- Preserve existing record identity during an upgrade. Do not recreate records to imitate a fresh installation.
- Document every public contract or migration change in the module README and app catalog.

## Backend modules

- Place application-owned business backend code in `apps/<app>/api/src/modules/<module>/`.
- Place an independently shipped reusable add-on in `packages/addons/<addon>` only after its public contract is stable.
- Keep the API source root thin. It may contain startup and composition only.
- Use module-prefixed filenames. Keep public exports in the module `index.ts`.
- Validate every external input with strict Zod schemas at the route boundary.
- Keep routes thin. Routes call module services. Services enforce business rules. Repositories own only module persistence.
- Enforce DDD dependency direction: presentation to application to domain, with infrastructure implementing ports defined inward.
- Keep domain code free of Fastify, Kysely, BullMQ, React, and application globals.
- Add events, workers, sync, migrations, and seeds only when the module has real behavior for them.
- Do not add empty, placeholder, wrapper, alias, or borrowed role files.

## Frontend modules

- Place business frontend code only in `apps/<app>/web/src/modules/<module>/`.
- Keep module API calls in `{module}.services.ts` and query behavior in `{module}.hooks.ts`.
- Keep executable validation in `{module}.schema.ts` and module-specific types in `{module}.types.ts`.
- Keep forms, lists, details, and workspaces as distinct implementations with distinct responsibilities.
- Treat `packages/ui` as the only source owner for reusable web UI.
- Put reusable primitives, components, form frames, field controls, blocks, layouts,
  templates, and visual variants in `packages/ui`.
- Import shared UI only through public `@codexsun/ui` exports.
- Do not create or copy an app-local reusable UI component, form framework, block,
  layout, or visual variant.
- Keep business fields, validation, data, routes, permissions, callbacks, workflows,
  and screen composition in the owning module. Pass them to package-owned UI.
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

## Deployment assembly

- Treat applications and add-ons as selectable source-owned units. Do not fork business code for a customer deployment.
- Register every deployable application and component in `.container/catalog.json` with explicit runtime bindings and dependencies.
- Use `packages/runtime` to produce one immutable plan before local startup, build, or container composition.
- Use the `development` profile to run every registered application locally. Use a versioned customer profile to select or omit production units.
- Keep one process boundary per container. Combine selected containers as one generated Compose deployment.
- Build and stage only selected workspaces and keep every generated artifact below root `dist`.
- Keep secrets outside profiles and source. Inject them through deployment environment or secret-manager bindings.
- Selecting an add-on does not authorize it. The target application must expose, validate, and load a documented public extension point.
- Reject unknown units, missing workspaces, dependency cycles, version incompatibility, unsafe output paths, and port conflicts before build.

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
9. `check:module-boundaries` passes for migration ownership and sibling public imports.
