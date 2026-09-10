# Framework Development Skill

## Use this when

Use this guide for `packages/framework`, `packages/platform-core`, shared runtime
contracts, module lifecycle, or public versioned capability changes.

Do not use it for application business behavior. Read [Modular Monolith](modular-monolith.md)
when a business module consumes the capability.

## Before code

1. Read `assist/architecture/framework-capability-roadmap.md`.
2. Read `assist/architecture/extension-standard.md` for add-on or extension-point work.
3. Read the golden rules, module standard, owning package README, and latest Platform development record.
4. Name the capability owner, first real consumer, lifecycle, failure behavior, and version impact.
5. Decide whether the change belongs to the framework kernel, Platform Core, an application composition root, or a business module.

## Ownership test

- Put runtime-neutral module metadata, planning, and lifecycle contracts in the framework.
- Put reusable HTTP, context, diagnostics, database, queue, storage, and web composition contracts in Platform Core.
- Put concrete infrastructure configuration and adapters in the owning application until reuse is proven.
- Put entities, policies, use cases, persistence, routes, views, jobs, and workflows in the business module.

If ownership is unclear, keep the capability with its first application consumer. Do not move it into a shared package to make it look reusable.

## Class rules

- Use a class only when it owns state, lifecycle, or a replaceable resource.
- Inject dependencies through an explicit constructor.
- Use pure functions for parsing, validation, sorting, and transformation.
- Prefer composition to base classes and inheritance.
- Do not use reflection, decorator scanning, a global container, or a service locator.
- Do not create `BaseService`, `BaseRepository`, generic CRUD, or one large manager class.
- Keep public exports intentional and versioned.
- Parse external manifests as unknown input before reading their fields.
- Reject unknown manifest fields and report all structural issues together.
- Require every extension contribution to depend on its point owner.
- Bind executable values through target-specific public contracts, not the framework manifest.
- Keep migration and seed contracts technical and target-specific. Keep each concrete declaration in its owning application module.
- Require publishers and consumers to use manifest-declared, versioned events. Do not imply durable delivery from an in-memory bus.
- Keep request context in async-local Platform Core state and carry cancellation through `AbortSignal`.

## Verification

Use [the stable release workflow](../operations/stable-release-workflow.md) for the first release.
Run `check:release:framework` once per candidate. Record the revision and reviewer decision.
A provider answer or passing kernel tests alone cannot approve the stable release.
For read-only candidate review outside the agent worktree, identify the exact checkout and patch state.
Use command-local `git -c safe.directory=<exact-reviewed-root>` only for a verified checkout with different sandbox ownership.
Never add wildcard or global Git trust exceptions. Do not confuse committed worktree files with the uncommitted candidate.

1. Test success, restart, invalid input, dependency failure, checksum mismatch, rollback, cancellation, and shutdown where relevant.
2. Test deterministic behavior and isolation when concurrency is possible.
3. Run the focused package tests and full root quality gate for a cross-workspace contract.
4. Update the owner README, architecture roadmap, development record, changelog, and this guide when the preferred workflow changes.
5. Report unavailable database, Redis, browser, desktop, mobile, or E2E proof.
