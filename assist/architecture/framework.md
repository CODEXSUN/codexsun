# Framework Contract

`packages/framework` is the runtime-neutral composition kernel for CODEXSUN.
It defines provider metadata, lifecycle orchestration, public contracts, and
test fixtures. It does not own HTTP, UI, drivers, persistence, or product rules.

## Provider Rules

Every provider declares a stable ID, owner, semantic version, dependencies, and
published contracts. The engine registers all providers before start, starts
them in dependency order, and stops them in reverse order. Missing dependencies
and cycles fail before any start hook. If a start hook fails, started providers
stop in reverse order.

Providers use `ProviderRegistrationContext` to publish and consume documented
public values. They must not reach into another provider's private files.

## Public Contracts

Framework contracts define typed `Result`, `FrameworkFailure`, `Page`,
`Command`, `Query`, and `DomainEvent` envelopes. They remain transport-neutral.

Public contracts are additive by default. A breaking removal or semantic change
requires a major-version decision, migration notes, consumer checks, and a
changelog entry. Use a new contract key for incompatible behavior.

## Extension Checklist

1. Keep the provider in its owning package or module.
2. Declare every external provider dependency in its manifest.
3. Publish only documented values and contracts.
4. Add graph and lifecycle tests with `@codexsun/framework/test`.
5. Update the module README, Assist plan/task, and changelog after verification.

The Framework does not permit shared domain behavior. A module still owns its
provider, routes, controller, services, repository, migrations, seeders, events,
tests, and README.
