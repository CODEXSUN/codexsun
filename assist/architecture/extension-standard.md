# Application and Add-on Extension Standard

## Purpose

This standard defines how CODEXSUN applications, modules, add-ons, and adapters extend the Platform without framework forks.

An application is a composition host. A module owns a complete capability. An add-on extends a named module point. An adapter binds a technical provider.

## Extension layers

| Layer              | Source owner                               | Extends                       | Examples                                |
| ------------------ | ------------------------------------------ | ----------------------------- | --------------------------------------- |
| Application        | `apps/<app>`                               | Platform composition          | CRM, HR, Billing, Ecommerce             |
| Application module | `apps/<app>/<target>/src/modules/<module>` | One application               | Customers, payroll, invoices            |
| Reusable add-on    | `packages/addons/<addon>`                  | A named extension point       | Tax pack, payment provider, report pack |
| Platform adapter   | `packages/platform-core/<target>`          | A technical contract          | HTTP, database, queue, storage          |
| Shared UI          | `packages/ui`                              | Visual primitives and layouts | Button, dialog, MDI shell               |

Do not place business add-ons in `packages/framework`, `packages/platform-core`, or `packages/ui`.

## Module kinds

Every framework manifest declares one kind:

- `core` provides a required technical Platform capability.
- `feature` provides an independently owned product capability.
- `addon` extends a feature through named extension points.
- `adapter` binds a technical contract to one provider.

The kind describes ownership. It does not change lifecycle order. Dependencies control lifecycle order.

## Extension point contract

The module that accepts extensions owns the extension point.

Each point declares:

- A globally unique identifier.
- A semantic version.
- `one` or `many` contribution cardinality.
- The public contract that carries the contribution value.
- Composition, ordering, failure, and removal behavior in its README.

Use `<owner>.<surface>.<slot>` identifiers. Examples include `platform.web.navigation`, `billing.api.tax-provider`, and `identity.api.policy-source`.

An extension point declaration does not carry application code. The target-specific public contract carries the executable value.

## Extension contribution contract

Each contribution declares:

- A globally unique identifier.
- The target extension point identifier.
- A compatible extension point version range.
- A stable integer order.
- A module dependency on the extension point owner.

The framework resolves declarations during composition. It rejects missing points, incompatible versions, duplicate IDs, missing owner dependencies, and single-slot conflicts.

The owning API or client adapter binds each resolved declaration to an executable public contract. The framework never imports Fastify, React, Tauri, Expo, MariaDB, Redis, or business code.

## Reusable add-on structure

Use this structure only when an add-on has a real second application consumer or must ship independently:

```text
packages/addons/<addon>/
  README.md
  package.json
  tsconfig.json
  src/
    manifest.ts
    shared/
    api/                 # only when the add-on provides API behavior
    web/                 # only when the add-on provides web behavior
    desktop/             # only after the Tauri plan is approved
    mobile/              # only after the Expo plan is approved
    index.ts
```

Keep the first implementation inside its application module. Extract it only after its public contract becomes stable.

An add-on package may expose target-specific factories. It must not import application-private files. The application composition root supplies its adapters and configuration.

## Application extension structure

A product application owns its target runtimes:

```text
apps/<product>/
  README.md
  api/src/modules/<module>/
  web/src/modules/<module>/
  desktop/               # optional and approved
  mobile/                # optional and approved
```

An application can replace an adapter through composition. It cannot replace another module's private behavior.

Use public contracts or events when one module needs another module. Declare the dependency and compatible version range in the consumer manifest.

## Supported extension surfaces

Create a point only when its owner can define a stable contract.

### API surfaces

- Fastify plugin factories.
- Route groups below an owner-approved prefix.
- Policy evaluators.
- Readiness probes.
- Shutdown tasks.
- Event handlers.
- Job handlers.
- Migration and seed contributions owned by the contributing module.

### Web surfaces

- Routes and navigation items.
- Application commands.
- Dashboard panels.
- Detail-page tabs.
- Form sections with explicit data contracts.
- Settings pages.
- Notifications and status items.

### Desktop and mobile surfaces

- Device capability adapters.
- Secure storage providers.
- File and share actions.
- Push notification handlers.
- Offline synchronization adapters.

Do not add desktop or mobile points before their platform plans define security and lifecycle behavior.

## Compatibility rules

- Increase an extension point patch version for compatible documentation or validation fixes.
- Increase its minor version for compatible optional fields or behavior.
- Increase its major version for removed fields, changed semantics, or new required behavior.
- Keep an old major point during a documented migration window when consumers cannot upgrade together.
- Reject incompatible add-ons before lifecycle installation starts.
- Do not rewrite a published add-on version. Publish a new semantic version.

## Installation and removal

1. Validate the manifest and all extension bindings.
2. Create one immutable composition plan.
3. Install dependencies before consumers.
4. Run module-owned migrations before activation.
5. Activate extensions in resolved order.
6. Deactivate consumers before providers.
7. Remove data only through the add-on uninstall policy.

Uninstall must default to data preservation. A destructive purge needs a separate explicit application action.

Migration and seed declarations remain inside the contributing module. The application supplies transaction, lock, and ledger adapters; it must not copy declarations into a central business migration folder.

Cross-module events must be declared by publisher and consumer with compatible versions. In-process delivery propagates handler failures but is not durable. Durable delivery requires a transactional outbox and idempotent inbox.

## Deployment selection

- Register a deployable add-on in `.container/catalog.json` only after its public extension contract is stable.
- Declare the target application and exact target component identifiers.
- Select the add-on in a versioned deployment profile. Do not modify the target application source for one customer.
- Stage the add-on only into its declared component images.
- Treat `CODEXSUN_ADDONS` as a requested selection, not as permission or proof of compatibility.
- Let the target application composition root validate the extension binding and run its module-owned lifecycle.
- Prove both selected and omitted profiles. An omitted add-on must leave no artifact in the final component image.

## Security and isolation

- Grant capabilities explicitly to the application composition.
- Validate all external input at the target runtime boundary.
- Keep secrets in application configuration.
- Keep private storage under the owning module path.
- Do not let add-ons inspect other module tables or files.
- Record network, filesystem, queue, and database needs before installation.
- Treat third-party add-ons as untrusted until review and verification finish.

## Scale rules

- Scale an application runtime before splitting modules into services.
- Keep module state independent from process state.
- Use an outbox before external event delivery requires failure recovery.
- Use BullMQ only when work needs independent retries, schedules, or workers.
- Partition large tables through the owning module's repository and migrations.
- Keep read models module-owned, even when an application composes them into one screen.
- Split a module only when ownership, release, or scaling behavior differs.

## Required documentation

Every extension point and contribution must appear in:

1. The owning module README.
2. The consuming add-on README.
3. The application module catalog.
4. A development record with binding and compatibility details.
5. The changelog when a public contract changes.

Use the [module README template](../templates/module-readme.md) and [add-on README template](../templates/addon-readme.md).

## Acceptance gate

An add-on is ready when:

1. The framework composition rejects every invalid binding before startup.
2. The add-on uses only declared public contracts.
3. Install, upgrade, activation, rollback, deactivation, and uninstall tests pass.
4. Target-specific code remains in its target folder.
5. No private cross-module import or direct sibling data write exists.
6. The package builds into root `dist` and uses root `node_modules`.
7. All documentation and root quality gates pass without warnings.
