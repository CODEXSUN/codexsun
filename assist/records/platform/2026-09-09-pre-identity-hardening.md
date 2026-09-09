# Pre-Identity Hardening

Date: 2026-09-09

## Outcome

The shared API foundation now defines the technical boundaries needed before Identity. Modules own readiness contributions. Request context carries a neutral actor. Authorization denies by default. Application configuration stays application-owned.

## Contracts and ownership

- `PlatformReadinessRegistry` owns duplicate checks, timeouts, safe failures, and module ownership metadata.
- `PlatformActor` identifies an anonymous, service, or user actor without role or tenant policy.
- `PlatformAuthorizer` defines one application binding. `DenyByDefaultPlatformAuthorizer` closes unbound access.
- `PlatformConfiguration` parses an application-owned Zod schema and selects named public values.
- Platform API supplies database, storage, and module-runtime readiness probes.
- API modules can supply their own readiness declarations without application-private imports.

The framework kernel did not change. Identity remains an application module.

## Runtime verification tools

`npm.cmd run runtime:smoke -- <profile>` starts a free profile, checks each health route and marker, requests supervisor shutdown, and checks port release. It refuses to replace an active listener.

`npm.cmd run test:mariadb:foundation` creates a PID-scoped test database. It tests clean installation, restart idempotency, advisory-lock contention, transaction rollback, interrupted migration recovery, and cleanup.

Preflight now builds each service's declared local package dependencies before it changes the active listener. This removes stale root-dist package failures while keeping the existing service alive if a dependency build fails.

## Resolved blockers

- The existing administrator credentials provisioned a database-scoped application account. Live MariaDB lifecycle and Platform readiness checks now pass.
- The Platform runtime now closes its supervisor IPC channel after child shutdown.
- Windows preflight now stops the complete owned process tree.
- The isolated Platform profile starts, passes health checks, stops, and releases ports `6010` and `6021`.
- The root runtime configuration now uses the database-scoped `codexsun@localhost` account instead of `root`.

Identity implementation can now start after the current repository state has a recovery checkpoint.

## Verification

- Passed Platform Core contract tests for configuration, readiness timeouts, and deny-by-default authorization.
- Passed Platform API composition tests for module-owned readiness and actor resolution.
- Passed Orship API failure parsing tests and the Orship web production build.
- Started Orship through preflight after rebuilding its contracts, opened the Failure Center in the browser, and confirmed captured process failures are visible.
- Passed repository layout, version, line-limit, documentation, boundary, dependency, formatting, lint, type-check, warning-free build, Turbo ownership, framework, runtime-holder, Orship, Zetro, Platform runtime, Platform web, and production server lifecycle gates.
- Passed `npm.cmd run mariadb:setup` and `npm.cmd run mariadb:smoke` as `codexsun@localhost`.
- Passed `npm.cmd run runtime:smoke -- platform-only`, including shutdown and port release.
