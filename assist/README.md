# CODEXSUN Assist

This folder contains the working documentation for the CODEXSUN repository.

## Repository roots

- `core/platforms/` contains system platform hosts.
- `core/registry/` contains application, add-on, and profile metadata.
- `apps/` contains deployable business suites.
- `devkits/` contains developer tools and internal applications.
- `packages/` contains shared public contracts and reusable infrastructure.

Do not recreate `registry/` at the repository root. Do not add root
`artifacts/`, `deployment/`, `.tmp-es-toolkit-repair/`, or `e2e/` scratch
directories.

Read these documents before you add an application, package, service, or shared contract.

## Required Read Order

1. Read architecture and governance guidance.
2. Read operations guidance for runtime, data, security, and deployment work.
3. Read execution and verification guidance before implementation.
4. Read the owner module documentation and register before module changes.

## Guides

- [Architecture](architecture/README.md) defines repository boundaries and ownership rules.
- [Tech stack plan](architecture/tech-stack.md) defines the selected technologies and delivery order.
- [Design system](architecture/design-system.md) defines themes, defaults, variants, and UI inheritance.
- [Framework contract](architecture/framework.md) defines provider lifecycle and public contracts.
- [Module architecture](architecture/module-architecture.md) defines the provider, module, add-on, app, platform, and deployment model.
- [Application catalog](architecture/application-catalog.md) defines host, add-on, and client deployment selection.
- [Contracts and events](architecture/contracts-and-events.md) defines public API and event integration.
- [Documentation](documentation/README.md) defines documentation requirements and writing rules.
- [Changelog](documentation/CHAGELOG.md) records repository progress from version 1.0.0.
- [Execution](execution/README.md) defines the delivery workflow and verification expectations.
- [Delivery workflow](execution/workflow.md) defines planning, implementation, verification, and handoff.
- [Verification standards](execution/verification.md) define static, live, Docker, and production evidence.
- [Zetro planning](execution/devkits/zetro/planning.md) defines the governed agentic IDE phases.
- [Zetro task register](execution/devkits/zetro/task.md) defines the next Zetro task and approval gates.
- [Assets](assets/README.md) lists shared visual and media assets.
- [Asset policy](assets/policy.md) defines asset ownership and licensing rules.
- [Governance](governance/README.md) records repository rules and decision controls.
- [Coding agent rules](governance/coding-agent-rules.md) define implementation boundaries and required checks.
- [Repository architecture rules](governance/repository-architecture-rules.md) define the mandatory modular-monolith and delivery rules.
- [Configuration rules](governance/configuration-rules.md) define root and application environment configuration.
- [Modules](modules/README.md) indexes module ownership and public contracts.
- [Module registry](modules/registry.md) defines required module registration data.
- [Operations](operations/README.md) describes runtime and support procedures.
- [Runtime layout](operations/runtime-layout.md) defines root storage, container, and deployment boundaries.
- [Workspace runtime](operations/workspace-runtime.md) defines root dependencies, build outputs, and TypeScript host configuration.
- [Versioning and releases](operations/versioning.md) defines version and release controls.
- [Data lifecycle](operations/data-lifecycle.md) defines database, migration, and backup rules.
- [Identity and security](operations/identity-and-security.md) defines ownership and security gates.
- [Observability](operations/observability.md) defines logs, health, metrics, traces, and audit records.
- [Deployment profiles](operations/deployment-profiles.md) defines client deployment composition and production gates.
- [Records](records/README.md) stores durable decisions and delivery records.
- [Assist coverage](records/assist-coverage.md) lists established guidance and remaining foundation decisions.
- [Skills](skills/README.md) lists task-specific working guidance.
- [Skill authoring](skills/authoring.md) defines repository-skill requirements.
- [Templates](templates/README.md) stores reusable document templates.

## Status

The repository is a scaffold. These documents set the initial direction. Update a guide when a reviewed decision changes it.
