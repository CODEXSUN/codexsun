# Modular Monolith Skill

## Use this when

Use this guide when creating, changing, reviewing, or composing a business module.
Match module manifests, lifecycle, events, migrations, repositories, dependencies,
or module boundaries.

Also read the API or Web UI skill for the module surface that changes.

## Before code

1. Read `assist/governance/golden-rules.md`.
2. Read `assist/architecture/module-standard.md`.
3. Read `assist/architecture/framework-capability-roadmap.md` when the change affects the framework or Platform Core.
4. Read the app catalog and the owning module README.
5. Read the latest application development record.
6. Identify the entity owner, public contracts, persistence owner, and composition root.
7. List the module version impact and migration impact.
8. Confirm DDD dependency direction and list every cross-module event binding.

## During code

- Keep business behavior inside the owning module.
- Use only public contracts for module relationships.
- Import sibling modules only through their public `index.ts`.
- Keep migrations, seeds, event schemas, and handlers inside their owning module.
- Declare published and consumed event versions before wiring handlers.
- Run database changes through the application transaction adapter and immutable checksum ledger.
- Keep composition roots free of business CRUD behavior.
- Keep authored files at 700 lines or fewer.
- Update the module README and app catalog in the same patch.
- Record references, binding properties, parallel work, decisions, and verification under `assist/records/<app>`.
- Update this skill when the change establishes a better repeatable module workflow.

## Before completion

1. Run `npm.cmd run check:module-boundaries` and `npm.cmd run check:module-dependencies`.
2. Scan for wrappers, aliases, generic CRUD, and direct sibling table writes.
3. Check the module manifest, lifecycle, dependency ranges, and version impact.
4. Run focused tests, TypeScript, build, and relevant persistence checks.
5. Run the module documentation gate.
6. Report checks that did not run.
