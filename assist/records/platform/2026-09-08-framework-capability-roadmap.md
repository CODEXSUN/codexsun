# Framework Capability Roadmap

## Outcome

CODEXSUN now has an explicit capability and class roadmap for framework growth before Identity development begins.

The roadmap separates the runtime-neutral framework kernel, reusable Platform Core contracts, application infrastructure, and business-module ownership. It also records implemented, required, consumer-driven, deferred, and rejected capabilities.

## Authoritative references

- Architecture: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md).
- Owner README: [Framework](../../../packages/framework/README.md).
- Governance: [Golden rules](../../governance/golden-rules.md).
- Local workflow: [Framework development skill](../../skills/framework-development.md).
- Existing implementation record: [Platform and framework foundation](2026-09-08-platform-framework-foundation.md).

## Ownership and boundaries

The framework owns manifests, validation, composition plans, lifecycle state, and lifecycle execution.

Platform Core may own stable technical contracts for HTTP composition, request context, health, shutdown, diagnostics, persistence adapters, events, jobs, and web composition.

Applications own concrete infrastructure and selected module composition. Business modules own their complete domain behavior.

## Binding properties

| Producer          | Consumer                | Binding                                        | Constraint          |
| ----------------- | ----------------------- | ---------------------------------------------- | ------------------- |
| Framework         | Application composition | Immutable module plan                          | Runtime-neutral     |
| Platform Core API | Application API         | Explicit adapter contracts                     | No business fields  |
| Application API   | Business module         | Constructor or public module context           | No hidden globals   |
| Module manifest   | Platform diagnostics    | Capability and contract declarations           | Read-only discovery |
| Node runtime      | Platform Core API       | Async context, diagnostics, abort, and signals | Adapter-owned       |

## Parallel work

The repository contained concurrent application, UI, documentation, and version-tool changes. This work added architecture and workflow documents only and did not rewrite those sources.

## Decisions

- Decision: Keep Fastify as the HTTP runtime without making it a kernel dependency.
- Decision: Use explicit constructors, factories, and narrow contracts instead of reflection-based dependency injection.
- Decision: Complete durable module state, migrations, request context, and diagnostics before Identity.
- Decision: Add events, BullMQ, Redis, and OpenTelemetry when a named module requires them.
- Rejected alternative: Install every feature supplied by a full-stack framework before a real consumer exists.
- Rejected alternative: Add generic CRUD, base repositories, automatic scanning, or a service locator.

## Verification

- Compared official Fastify, NestJS, AdonisJS, Hono, Node.js, and OpenTelemetry documentation.
- `npm.cmd run check` passed workspace layout, line limits, documentation, formatting, lint, type checks, production builds, the 400 KB chunk budget, framework tests, Platform web composition tests, and server E2E tests.
- Corrected the explicit custom `data-*` property type in concurrent interface-topology UI work after the root type check exposed it.
- Did not change or execute application runtime code.
- Did not verify MariaDB, Redis, browser, desktop, or mobile behavior because this change defines architecture only.

## Follow-up work

Implement Stage 1 from the roadmap: durable installed-module state and the module-owned migration ledger in Platform API.
