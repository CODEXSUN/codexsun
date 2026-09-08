# Assist Documentation

This folder is the repository-owned context for people and coding agents. It records what the project is, how its parts are owned, and the local skills that must guide implementation.

## Read in this order

1. [../AGENTS.md](../AGENTS.md)
2. [../README.md](../README.md)
3. [architecture.md](architecture.md)
4. [governance/golden-rules.md](governance/golden-rules.md)
5. [architecture/module-standard.md](architecture/module-standard.md)
6. [architecture/application-standard.md](architecture/application-standard.md) for application or runtime work
7. [architecture/deployment-assembly-standard.md](architecture/deployment-assembly-standard.md) for deployable application, add-on, profile, or container work
8. The relevant guide in [skills](skills)

## Documents

- [architecture.md](architecture.md) — current system boundary and planned clients.
- [governance/golden-rules.md](governance/golden-rules.md) — mandatory modular-monolith, DDD, documentation, and file-size rules.
- [governance/development-records.md](governance/development-records.md) — required notes, references, bindings, and parallel-work records.
- [architecture/module-standard.md](architecture/module-standard.md) — module folders, ownership, lifecycle, and versioning structure.
- [architecture/application-standard.md](architecture/application-standard.md) — required application ownership, runtime, documentation, and verification baseline.
- [architecture/runtime-foundation.md](architecture/runtime-foundation.md) — server ports, logging, health, preflight, and shutdown contracts.
- [architecture/framework-capability-roadmap.md](architecture/framework-capability-roadmap.md) — framework feature ownership, preferred classes, reference patterns, and staged growth plan.
- [architecture/extension-standard.md](architecture/extension-standard.md) — application, module, add-on, adapter, extension-point, and compatibility rules.
- [architecture/deployment-assembly-standard.md](architecture/deployment-assembly-standard.md) — shared runtime holder, catalog, customer-profile, artifact, and container rules.
- [templates/application-readme.md](templates/application-readme.md) — required README structure for every application.
- [templates/development-record.md](templates/development-record.md) — required structure for module and feature work notes.
- [templates/addon-readme.md](templates/addon-readme.md) — required documentation structure for reusable add-ons.
- [records/README.md](records/README.md) — index of completed development records.
- [modules/README.md](modules/README.md) — external app and module catalog.
- [modules/zetro.md](modules/zetro.md) — Zetro chat and task module composition.
- [modules/devkit.md](modules/devkit.md) — DevKit project planning module composition.
- [modules/orship.md](modules/orship.md) — Orship live service and process-control composition.
- [skills/web-ui.md](skills/web-ui.md) — rules for React web work.
- [skills/ui-template-pages.md](skills/ui-template-pages.md) — standard component and block documentation page composition.
- [skills/api.md](skills/api.md) — rules for Fastify API work.
- [skills/modular-monolith.md](skills/modular-monolith.md) — module audit and composition rules.
- [skills/framework-development.md](skills/framework-development.md) — framework and Platform Core ownership, class design, and verification rules.
- [skills/deployment-assembly.md](skills/deployment-assembly.md) — catalog, profile, selected-build, and Docker assembly workflow.
- [skills/server-runtime.md](skills/server-runtime.md) — verified local server startup, shutdown, and restart rules.
- [../deployments/README.md](../deployments/README.md) — runnable deployment profile and container commands.
- [operations/versioning.md](operations/versioning.md) — version, changelog, and interactive GitHub release workflow.

Keep this index current when adding a new application, package, system integration, or local skill.
