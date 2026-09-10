# Framework Capability Roadmap

## Purpose

This document defines the long-term capability map for the CODEXSUN framework and Platform Core. It prevents framework growth from becoming an unowned collection of helpers.

The framework is a small, runtime-neutral kernel. Platform Core supplies reusable technical adapters. An application selects adapters and composes business modules. A business module owns its domain behavior.

## Selection rules

Add a capability only when all these conditions are true:

1. It has at least one named owner and consumer.
2. Its contract can remain free of business fields and workflows.
3. Its lifecycle, failure behavior, and version compatibility are explicit.
4. It can be tested without starting an unrelated application.
5. It does not bypass a module public contract.

Prefer a small explicit class with constructor dependencies. Do not use reflection, runtime class scanning, hidden globals, or a service locator. Add an interface at the consumer boundary when two implementations exist or a test double is required.

## Framework lessons adopted

| Reference     | Useful pattern                                                                                | CODEXSUN decision                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Fastify       | Encapsulated plugin graph, hooks, schemas, serializers, error scopes, and test injection      | Use Fastify only in API adapters and application composition. Preserve its encapsulation boundaries.                        |
| NestJS        | Module graph, providers, lifecycle phases, guards, pipes, interceptors, and exception filters | Adopt explicit phases and scoped pipeline contracts. Do not adopt decorator reflection or a global container.               |
| AdonisJS      | Service providers, request-scoped dependencies, health checks, events, queues, and adapters   | Use explicit provider factories and application-owned adapters. Keep request context and infrastructure outside the kernel. |
| Hono          | Small middleware surface and typed validation at runtime boundaries                           | Keep adapters thin and share stable request and response schemas. Do not make the kernel depend on one HTTP runtime.        |
| Node.js       | Async context, diagnostics channels, abort signals, test runner, and process signals          | Use Node primitives inside Platform Core runtime packages. Expose narrow CODEXSUN contracts to modules.                     |
| OpenTelemetry | Standard traces, metrics, context propagation, resources, and exporters                       | Use opt-in application instrumentation through Platform Core. Keep exporters out of business modules.                       |

These are design references, not dependencies that CODEXSUN must install.

## Ownership map

### Framework kernel

`packages/framework` may own only these runtime-neutral capabilities:

- Module manifest types and validation.
- Semantic version and Platform compatibility checks.
- Dependency graph validation and deterministic composition plans.
- Module lifecycle state and ordered lifecycle execution.
- Activation rollback and reverse-order shutdown.
- Capability, public contract, event, and configuration declarations.
- Typed framework errors and diagnostics results.
- Extension contracts that do not reference HTTP, databases, queues, UI, users, or tenants.
- Versioned extension points, contributions, cardinality, and deterministic resolution.

The kernel must not own authentication, authorization policy decisions, tenant context, database connections, migrations, HTTP routes, files, queues, caches, telemetry exporters, or UI.

### Platform Core API

`packages/platform-core/api` may provide reusable technical contracts and adapters for:

- Fastify module registration and scoped hooks.
- Request context and correlation identifiers.
- Configuration parsing and secret references.
- Readiness, liveness, and component health contributions.
- Ordered shutdown and cancellation through `AbortSignal`.
- Structured logging and redaction policy.
- Tracing and metrics integration.
- Transaction boundaries and database adapter contracts.
- Migration ledger and module state repository contracts.
- Event publishing, durable outbox, and inbox deduplication contracts.
- BullMQ queue, worker, retry, schedule, and dead-letter adapters.
- Cache and distributed lock contracts when a real module needs them.
- Idempotency keys and replay-safe command execution.
- Rate-limit, CORS, security-header, and API-version adapters.

Infrastructure implementations remain in the owning application until two applications need the same proven adapter.

### Platform Core web

`packages/platform-core/web` may provide reusable technical composition for:

- Route and navigation contributions.
- Query client construction and API error normalization.
- Runtime configuration and feature capability discovery.
- Error, loading, empty, unavailable, and retry boundaries.
- Application shell integration and command contributions.
- Accessibility, localization, theme, and telemetry adapters.

Business field definitions, data, validation, permissions, workflows, and screen
composition remain in their modules. Reusable form, list, and dashboard UI belongs in `packages/ui`.

### Application composition

Each `apps/<app>` composition root owns:

- The selected modules and adapters.
- Concrete Fastify, MariaDB, Redis, BullMQ, storage, and telemetry setup.
- Environment validation and startup failure policy.
- Installed-module state plus migration, seed, transaction, and lock coordination. Concrete migrations and seeds remain in owning modules.
- Public HTTP exposure and security policy.
- Process startup, signals, shutdown, and operational logs.
- Web routes and navigation assembled from module contributions.

The cross-application deployment plan is a separate concern. `packages/runtime` validates which application composition roots and add-ons enter a deployment. It may bind framework and Platform package versions, but it does not own application modules, infrastructure policy, or business behavior.

## Preferred class design

Classes represent stateful lifecycle owners. Pure validation and transformation remain functions.

| Class or contract          | Owner             | Responsibility                                                                         |
| -------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `ModuleRegistry`           | Framework         | Accept manifests before lock and expose registered definitions.                        |
| `ModuleCompositionPlanner` | Framework         | Validate compatibility and create one immutable dependency plan.                       |
| `ModuleLifecycleExecutor`  | Framework         | Run install, upgrade, activation, rollback, deactivation, and uninstall in plan order. |
| `ModuleRuntime`            | Framework         | Hold the explicit runtime state for one composed plan.                                 |
| `CapabilityRegistry`       | Framework         | Index declared capabilities without implementing them.                                 |
| `ContractRegistry`         | Framework         | Index public contract identifiers and versions.                                        |
| `ConfigurationRegistry`    | Platform Core     | Parse and expose validated runtime configuration.                                      |
| `RequestContext`           | Platform Core API | Expose correlation, actor, locale, and cancellation for one request without globals.   |
| `ReadinessRegistry`        | Platform Core API | Aggregate named component probes and report actionable failure details.                |
| `ShutdownCoordinator`      | Platform Core API | Close registered resources once in reverse dependency order.                           |
| `ModuleStateRepository`    | Application API   | Persist installed version, state, and failure details in MariaDB.                      |
| `ModuleMigrationRunner`    | Application API   | Run ordered, checksum-protected, module-owned migrations.                              |
| `TransactionRunner`        | Platform Core API | Define an explicit unit-of-work boundary for one database adapter.                     |
| `EventPublisher`           | Platform Core API | Publish typed module events through an application-selected transport.                 |
| `OutboxDispatcher`         | Application API   | Deliver committed events with retry and idempotency.                                   |
| `JobDispatcher`            | Platform Core API | Submit versioned jobs without exposing BullMQ to domain code.                          |
| `TelemetryProvider`        | Platform Core API | Configure traces and metrics for an application runtime.                               |
| `DeploymentPlanner`        | Runtime holder    | Resolve selected applications, add-ons, process components, ports, and package ranges. |

Do not create one large `FrameworkManager`, `BaseService`, or `BaseRepository`. Do not make all services inherit from framework classes. Use composition and narrow contracts.

## Capability status

### Implemented foundation

- Complete module manifests with ownership, versions, compatibility, dependencies, capabilities, contracts, events, and configuration requirements.
- Strict runtime manifest parsing for unknown add-on input.
- Module kinds and versioned add-on extension declarations.
- Pre-start validation for extension point existence, compatibility, ownership dependencies, uniqueness, and cardinality.
- Deterministic immutable extension resolution in the composition plan.
- Aggregated manifest and graph validation.
- Deterministic immutable composition plans and registry locking.
- Install, upgrade, activate, deactivate, uninstall, rollback, and reverse shutdown.
- Fastify application binding, injectable runtime dependencies, component readiness, and shutdown tasks.
- Shared HTTP envelope schemas and Platform route and navigation contributions.
- System runtime API and web workspace.
- Durable MariaDB module state with module-owned migration and seed ledgers.
- Checksum-protected, dependency-ordered module preparation under a MariaDB advisory lock.
- Async request context with correlation, locale, request identity, and cancellation.
- Structured lifecycle, runtime, and readiness diagnostics.
- Manifest-enforced in-process event publication and consumption.
- Fastify response schemas for Platform health, readiness, and runtime routes.
- Read-only capability, contract, event, and extension discovery through the System runtime contract.
- Profile-driven deployment planning with selected builds and one-container-per-process Compose output.
- Shared Pino logging, request correlation, OpenTelemetry HTTP traces, metrics, and OTLP export.
- Module-owned readiness probes with owner metadata and bounded timeouts.
- Neutral actor context, deny-by-default authorization contracts, and application resolver hooks.
- Application-owned Zod configuration through a shared parse and public-selection contract.

### Remaining before Identity

1. Configure a password-authenticated MariaDB application account.
2. Run the live foundation test for clean install, restart, lock contention, rollback, and recovery.
3. Stop the active Platform profile and run the complete startup and shutdown smoke cycle.

Identity may then add authentication and authorization through application and module contracts. Actor, role, permission, session, and tenant rules must not enter the generic kernel.

### Add when the first real consumer exists

- Transactional outbox and idempotent inbox.
- BullMQ jobs, workers, schedules, retry policy, and dead-letter handling.
- Redis cache and distributed locks.
- API rate limits, pagination conventions, conditional requests, and idempotency keys.
- Audit records owned by the module that performs the regulated action.
- Web localization, offline state, and client telemetry.
- Tauri and Expo adapters after their platform plans are approved.

### Explicitly deferred or rejected

- Reflection-based dependency injection and decorator scanning.
- Automatic filesystem module discovery in production.
- Global mutable service locators.
- Generic CRUD engines, dynamic repositories, and metadata-driven business behavior.
- Business entities, permissions, tenant context, or workflows in shared packages.
- A microservice per module.
- Redis or BullMQ before configuration, ownership, recovery, and operations are documented.
- Desktop or mobile adapters before an approved platform contract exists.

## Delivery stages

### Stage 1: Durable module runtime

Preparation: [Durable module runtime preparation](../records/platform/2026-09-08-module-runtime-preparation.md).

- Define the MariaDB module-state and migration-ledger schemas.
- Implement `ModuleStateRepository` and `ModuleMigrationRunner` in Platform API.
- Prove clean install, restart, compatible upgrade, failed migration, and recovery.
- Keep migration files and seed data in the owning module.

### Stage 2: Request and diagnostic foundation

- Add `RequestContext` with `AsyncLocalStorage` in Platform Core API.
- Propagate request, correlation, and cancellation data through route services.
- Add structured lifecycle and readiness diagnostics.
- Add focused concurrency and context-isolation tests.

### Stage 3: Identity extension points

- Platform-owned [Identity client](../../apps/platform/contracts/README.md) supplies public HTTP access without moving Identity policy into the kernel.
- Define actor and policy interfaces at API consumers.
- Implement Identity as an application module, not a framework feature.
- Bind authentication in Fastify hooks and authorization at named route or use-case boundaries.
- Prove unauthenticated, forbidden, allowed, expired, and revoked flows.

### Stage 4: Events and background work

- Start with typed in-process events.
- Add a transactional outbox only when events must survive process failure.
- Add BullMQ only for work that needs independent retry or scheduling.
- Version event and job payloads and document retry and dead-letter behavior.

### Stage 5: Client platform adapters

- Define shared contracts before adding Tauri or Expo implementations.
- Keep device permissions, updates, secure storage, push, and offline sync in platform adapters.
- Keep business behavior in the same owning product module.

## Acceptance gate for a new framework feature

A framework feature is ready only when:

1. Its owner and at least one real consumer are named.
2. The public contract and version impact are documented.
3. Failure, cancellation, startup, and shutdown behavior are tested where relevant.
4. It does not import application-private or business-module code.
5. It has no hidden global state or reflection-only dependency.
6. The owning README, development record, architecture reference, and local skill are current.
7. Root quality gates pass with no warning, error, oversized file, nested install, misplaced output, or oversized production chunk.

## Official references

- [Fastify plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
- [Fastify encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/)
- [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [NestJS modules](https://docs.nestjs.com/modules)
- [NestJS providers](https://docs.nestjs.com/providers)
- [NestJS request lifecycle](https://docs.nestjs.com/faq/request-lifecycle)
- [AdonisJS dependency injection](https://docs.adonisjs.com/guides/concepts/dependency-injection)
- [AdonisJS service providers](https://docs.adonisjs.com/guides/concepts/service-providers)
- [Hono validation](https://hono.dev/docs/guides/validation)
- [Node.js asynchronous context tracking](https://nodejs.org/api/async_context.html)
- [Node.js diagnostics channel](https://nodejs.org/api/diagnostics_channel.html)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
