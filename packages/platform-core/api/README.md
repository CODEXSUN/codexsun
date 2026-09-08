# Platform Core API

This package owns reusable API module contracts. It must not own deployable routes or business behavior.

Each `PlatformApiModule` exposes a validated framework manifest and a Fastify plugin factory. The factory receives the approved module context.

The context binds a clock, ID generator, module summaries, shutdown tasks, and a shutdown signal. It does not expose application globals or another module's private state.

`PlatformShutdownRegistry` closes registered tasks once in reverse order.

## Development records

- [2026-09-08 Platform and framework foundation](../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
