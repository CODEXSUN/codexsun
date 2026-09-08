# Platform Core API

This package owns reusable API module contracts. It must not own deployable routes or business behavior.

Each `PlatformApiModule` exposes a validated framework manifest and a Fastify plugin factory. The factory receives the approved module context.

The context binds a clock, ID generator, complete module summaries, request context, scoped events, diagnostics, shutdown tasks, and a shutdown signal. It does not expose application globals or another module's private state.

`PlatformRequestContextStore` uses async-local state for request ID, correlation ID, locale, and cancellation. `DeclaredPlatformEventBus` scopes a module to the published and consumed event versions in its manifest. `PlatformDiagnosticRegistry` keeps bounded structured operational events.

`PlatformModuleMigration` and `PlatformModuleSeed` are target-specific declaration contracts. Concrete declarations stay inside the owning application module; the composition root supplies transactions, locking, and durable ledger storage.

`PlatformShutdownRegistry` closes registered tasks once in reverse order.

## Development records

- [2026-09-08 Platform and framework foundation](../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Durable module runtime](../../../assist/records/platform/2026-09-08-durable-module-runtime.md)
