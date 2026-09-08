# Durable Module Runtime

## Outcome

Platform now has an explicit durable module-preparation foundation before Identity work starts. The framework remains runtime-neutral. Platform Core owns reusable request, event, diagnostic, migration, and seed contracts. Platform API owns MariaDB coordination and the technical `module-runtime` module.

## Authoritative references

- Runtime owner: [Module Runtime API](../../../apps/platform/api/src/modules/module-runtime/README.md).
- Application owner: [Platform](../../../apps/platform/README.md).
- Kernel boundary: [Framework](../../../packages/framework/README.md).
- Architecture: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md).
- Module rules: [Module standard](../../architecture/module-standard.md).
- Governance: [Golden rules](../../governance/golden-rules.md).

## Ownership and binding properties

- `packages/framework` validates manifests, creates the immutable dependency plan, selects new module install hooks, and reports lifecycle phases. It has no Fastify, MariaDB, or business dependency.
- `packages/platform-core/api` provides async request context, scoped declared events, bounded diagnostics, and target-specific migration and seed contracts.
- `apps/platform/api/src/modules/module-runtime` owns `platform_module_state`, `platform_module_migrations`, and `platform_module_seeds`, plus the Kysely repository, transaction runner, advisory lock, coordinator, migration, and seed.
- Each persistent module supplies its own ordered `migrations` and `seeds` beside its module code. The application composition root supplies the database transaction and lock adapters.
- Module preparation runs in framework dependency order. Applied checksums are immutable. New modules run install hooks; changed installed versions run upgrade hooks; activation starts only after data preparation succeeds.
- `DeclaredPlatformEventBus` rejects undeclared publications and subscriptions. Its current adapter is in-process and does not promise durable delivery.
- Fastify request context carries request ID, correlation ID, locale, and an `AbortSignal`. Public health, readiness, and System runtime responses use Zod-derived response schemas.
- Liveness does not wait for MariaDB. Module preparation starts after the listener opens, readiness reports the module-runtime state, and non-diagnostic module routes return `MODULE_NOT_ACTIVE` until activation completes.

## DDD and modular boundaries

Business modules own their aggregates, use cases, ports, adapters, routes, events, migrations, seeds, tests, and README. Presentation depends inward on application and domain. Infrastructure implements inward-owned ports. A module may import a sibling only through its public `index.ts` and a declared manifest dependency.

The new `check:module-boundaries` gate rejects migration or seed source outside an owning API module and rejects direct imports of sibling private files. Two Zetro API route imports were changed to use the Projects public entry point; their behavior was not changed.

## Parallel work preserved

The worktree contained concurrent Docs, DevKit, Zetro, Platform web, and shared UI changes. This change did not rewrite or remove those features. It touched two Zetro import paths only to satisfy the new public module boundary and left their implementations unchanged.

## Verification

Passed during implementation:

- `npm.cmd run build:api`
- `node --test tools/platform-api-composition.test.mjs tools/platform-core-api.test.mjs tools/platform-module-runtime.test.mjs`
- `node --test tools/e2e/server-lifecycle.e2e.mjs`
- `npm.cmd run check`

The focused suite proves dependency-ordered preparation, unchanged restart behavior, checksum rejection, durable state transitions in the memory repository, route activation state, declared event boundaries, request context propagation, Fastify serialization, degraded liveness, graceful signals, supervisor IPC, and port release.

The full root gate passed for all 18 workspaces with no layout, line-limit, documentation, module-boundary, formatting, lint, type, build, chunk-budget, framework, web-composition, or server-test warning or error. Production JavaScript chunk validation covered 150 chunks.

## Not yet verified

- A live MariaDB clean install and restart did not run because the configured local server requests an unavailable `auth_gssapi_client` authentication plugin.
- MariaDB transaction rollback, advisory-lock contention, interrupted-migration recovery, and live database recovery remain required integration checks.
- A transactional outbox, idempotent inbox, BullMQ worker adapter, authentication, authorization, tenancy, Tauri, and Expo remain outside this foundation.

## Next work

Add module-owned health contributions and complete live MariaDB runtime verification. Identity can then define actor and authorization contracts at application boundaries without adding business or tenant policy to the framework kernel.
