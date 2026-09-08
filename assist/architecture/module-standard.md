# Module Standard

## Module manifest

Each module exposes a module manifest from `{module}.module.ts`. The manifest declares:

- Stable module identifier.
- Semantic module version.
- Module kind: `core`, `feature`, `addon`, or `adapter`.
- Module scope and capabilities.
- Required module dependencies and version ranges.
- Public API and event contracts.
- Configuration requirements and the supported Platform version range.
- A clear owner and short description.
- Install, activate, upgrade, deactivate, and uninstall behavior.
- Owned extension points and supplied extension contributions.

The manifest is the plug-and-play contract. It must not hide dependencies through imports of application singletons.

The registry validates all manifests before composition. It returns an immutable plan and then rejects late registration.

The lifecycle executor activates dependencies first. It deactivates consumers first. An activation failure rolls back completed modules.

API and web composition bind modules through Platform Core contracts. Record each binding in the application development record.

Read the [extension standard](extension-standard.md) before adding an extension point, add-on, or adapter. An extension contribution must declare a compatible point version and depend on the point owner.

## Backend structure

```text
apps/<app>/api/src/modules/<module>/
  README.md
  <module>.module.ts
  <module>.types.ts
  <module>.service.ts
  <module>.repository.ts
  <module>.routes.ts
  <module>.migration.ts      # only when the module owns persistence
  <module>.seed.ts           # only when the module owns seed data
  <module>.events.ts         # only when events exist
  <module>.worker.ts         # only when jobs exist
  <module>.sync.ts           # only when sync exists
  <module>.test.ts           # focused module tests
  index.ts
```

Use the role files only when they contain real executable behavior. Record an intentional omission in the module README.

## Frontend structure

```text
apps/<app>/web/src/modules/<module>/
  README.md
  <module>.workspace.tsx
  <module>.list.tsx
  <module>.form.tsx
  <module>.details.tsx       # only when details exist
  <module>.services.ts
  <module>.hooks.ts
  <module>.schema.ts
  <module>.types.ts
  <module>.test.tsx
  index.ts
```

The frontend README may link to the backend README when they document one module contract. It must still describe the frontend routes and user flows that it owns.

## Module documentation

Use [module README template](../templates/module-readme.md) for every module. Keep the module README beside the module code. Add one catalog entry in `assist/modules/<app>.md` that links to this README.

## Version compatibility

Use semantic versions for module manifests.

- Increase the patch version for a compatible internal fix.
- Increase the minor version for a compatible capability or optional contract.
- Increase the major version for a breaking public contract, migration, or lifecycle change.
- Declare compatibility ranges for every required module dependency.
- Test install and upgrade behavior against an existing persisted database when a module owns migrations.
