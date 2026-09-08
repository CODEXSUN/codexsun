# Modular Monolith Skill

Use this guide when creating, changing, reviewing, or composing a module.

## Before code

1. Read `assist/governance/golden-rules.md`.
2. Read `assist/architecture/module-standard.md`.
3. Read `assist/architecture/framework-capability-roadmap.md` when the change affects the framework or Platform Core.
4. Read the app catalog and the owning module README.
5. Read the latest application development record.
6. Identify the entity owner, public contracts, persistence owner, and composition root.
7. List the module version impact and migration impact.

## During code

- Keep business behavior inside the owning module.
- Use only public contracts for module relationships.
- Keep composition roots free of business CRUD behavior.
- Keep authored files at 700 lines or fewer.
- Update the module README and app catalog in the same patch.
- Record references, binding properties, parallel work, decisions, and verification under `assist/records/<app>`.
- Update this skill when the change establishes a better repeatable module workflow.

## Before completion

1. Scan for private imports, wrappers, aliases, generic CRUD, and direct sibling table writes.
2. Check the module manifest, lifecycle, dependency ranges, and version impact.
3. Run focused tests, TypeScript, build, and relevant persistence checks.
4. Run the module documentation gate.
5. Report checks that did not run.
