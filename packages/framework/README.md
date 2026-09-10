# Framework

## Purpose

The framework owns only generic module lifecycle and registry contracts.

## Boundary

It must not own business entities, database tables, authentication, HTTP routes, UI, or product workflows.

## Public contract

The package exports versioned module manifests, validation results, immutable composition plans, lifecycle execution, extension declarations, and typed errors.

The registry validates identity, versions, ownership, capabilities, dependencies, configuration, public contracts, and events. It reports all composition issues and returns complete cycle paths.

The public manifest parser accepts unknown runtime input. It rejects missing fields, unknown fields, invalid lifecycle functions, and invalid value shapes before semantic composition starts.

The registry locks after it creates a plan. Plans use deterministic dependency order. Activation failures deactivate completed modules in reverse order. The lifecycle executor can install only newly discovered modules and reports structured start, completion, and failure events without importing an application logger.
Lifecycle operations cannot overlap on one executor. A concurrent call rejects with `ModuleLifecycleStateError`.
Await the active operation before another phase. Deactivate active modules before uninstall.
The guard releases after success or failure. Sequential activation remains idempotent while active.
Registration snapshots and freezes manifests before public reads, not only when planning.
Capabilities and public contract names are module-scoped; they do not imply a global singleton provider.
Reporters are synchronous observers. Reporter exceptions do not change lifecycle outcomes.
Inspect `reporterErrors` for the latest 100 reporting failures; its returned snapshot is frozen.
Failed deactivation and activation rollback retain modules whose cleanup failed.
Retry `deactivate()` to clean only those modules in reverse dependency order.
Install, upgrade, activation, and uninstall cannot proceed while this cleanup remains pending.
Successful cleanup is not repeated. Other deactivation hooks are still attempted after a failure.
Hooks must clean their own partially acquired resources before throwing during activation.
Install rollback errors remain explicit errors for the module owner to recover; they are not automatic retries.

Modules declare a `core`, `feature`, `addon`, or `adapter` kind. Extension point owners define a semantic version and `one` or `many` cardinality. Add-ons declare compatible contributions and depend on each point owner.

Composition rejects missing points, incompatible versions, duplicate declarations, missing owner dependencies, and cardinality conflicts. The immutable plan exposes extensions in point, order, and identifier order.

## Capability roadmap

Read the [framework capability roadmap](../../assist/architecture/framework-capability-roadmap.md) before expanding this package. It defines the allowed kernel boundary, preferred class responsibilities, staged work, and explicitly rejected framework features.

Use the [framework development skill](../../assist/skills/framework-development.md) for implementation and review.

## Development records

- [First stable release task](../../assist/tasks/framework-first-release.md)
- [Lifecycle concurrency guard](../../assist/records/platform/2026-09-10-framework-release-guard.md)

- [2026-09-08 Platform and framework foundation](../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Framework capability roadmap](../../assist/records/platform/2026-09-08-framework-capability-roadmap.md)
- [2026-09-08 Extensible application and add-on foundation](../../assist/records/platform/2026-09-08-extension-foundation.md)
- [2026-09-08 Safe runtime manifest boundary](../../assist/records/platform/2026-09-08-manifest-boundary.md)
- [2026-09-08 Durable module runtime](../../assist/records/platform/2026-09-08-durable-module-runtime.md)
