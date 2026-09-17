# Assist Coverage

## Documentation status

The Assist foundation is complete. The decision gates below require explicit approval before related source scaffolding starts.

## Established guidance

- Technology stack and client targets.
- Modular-monolith, DDD, event, provider, add-on, app, platform, and deployable boundaries.
- Central package and UI reuse rules.
- Module folder ownership and 700-line file limit.
- Root storage, container runtime, and deployment boundaries.
- Root dependencies, build output, Turborepo cache, and TypeScript host rules.
- Root and application environment configuration rules.
- Versioning, changelog, documentation, and coding-agent rules.

## Documented decision gates

- [Application catalog](../architecture/application-catalog.md) defines application and add-on selection.
- [Contracts and events](../architecture/contracts-and-events.md) defines API and event rules.
- [Data lifecycle](../operations/data-lifecycle.md) defines database, migration, and backup rules.
- [Identity and security](../operations/identity-and-security.md) defines security decision gates.
- [Observability](../operations/observability.md) defines logs, metrics, traces, and audit records.
- [Deployment profiles](../operations/deployment-profiles.md) defines environment selection and production gates.
- [Workspace runtime](../operations/workspace-runtime.md) defines the root workspace decision gate.

## Enforcement work required after scaffolding

- Add checks for nested `node_modules/`, nested `dist/`, and cache output outside `dist/.turbo/`.
- Add checks for the 700-line authored-file limit.
- Add checks for module folder ownership and private cross-module imports.
- Add checks for hardcoded ports, URLs, credentials, and environment values.
- Add checks that each app has one API and one web TypeScript configuration.
