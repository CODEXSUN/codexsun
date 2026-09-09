# Platform Core API

This package owns reusable API module contracts. It must not own deployable routes or business behavior.

Each `PlatformApiModule` exposes a validated framework manifest and a Fastify plugin factory. The factory receives the approved module context.

The context binds a clock, ID generator, module summaries, request context, authorization, readiness, scoped events, diagnostics, shutdown tasks, and a shutdown signal. It does not expose application globals or another module's private state.

`PlatformRequestContextStore` uses async-local state for actor, request ID, correlation ID, locale, and cancellation. `DenyByDefaultPlatformAuthorizer` keeps protected work closed until an application supplies a policy. These contracts contain no roles, permissions, sessions, or tenant rules.

`PlatformReadinessRegistry` accepts application and module-owned probes. Each probe declares its module owner and timeout. `PlatformConfiguration` parses one application-owned Zod schema and exposes only named public values.

`PlatformEnvironmentLoader` reads the root `.env`, preserves process precedence, applies explicit aliases, supplies safe defaults, and publishes missing values to the process environment. Each application still owns and validates its schema. Administrator-only settings must stay outside runtime schemas.

`DeclaredPlatformEventBus` scopes a module to event versions in its manifest. `PlatformDiagnosticRegistry` keeps bounded structured operational events.

`PlatformModuleMigration` and `PlatformModuleSeed` are target-specific declaration contracts. Concrete declarations stay inside the owning application module; the composition root supplies transactions, locking, and durable ledger storage.

`PlatformShutdownRegistry` closes registered tasks once in reverse order.

`PlatformApiObservability` supplies one technical logging and telemetry boundary for every Fastify API. Each application provides its application and component identifiers. The adapter validates request identifiers, returns request and correlation headers, and records HTTP request spans and metrics.

Production uses structured Pino JSON. Development can use Pino Pretty. The logger includes application, component, service, version, and environment fields. Request logs also include correlation, trace, and span identifiers. The shared redaction policy removes authorization, cookie, password, token, and API-key values.

`PlatformTelemetry` exports traces and metrics through OTLP HTTP when an endpoint exists and `OTEL_SDK_DISABLED` is not `true`. No exporter starts without an endpoint. Applications close the telemetry SDK through their Fastify shutdown lifecycle.

## Development records

- [2026-09-09 Build and observability foundation](../../../assist/records/platform/2026-09-09-build-observability-foundation.md)
- [2026-09-09 Pre-Identity hardening](../../../assist/records/platform/2026-09-09-pre-identity-hardening.md)
- [2026-09-09 MariaDB and environment foundation](../../../assist/records/platform/2026-09-09-mariadb-environment-foundation.md)
- [2026-09-08 Platform and framework foundation](../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Durable module runtime](../../../assist/records/platform/2026-09-08-durable-module-runtime.md)
