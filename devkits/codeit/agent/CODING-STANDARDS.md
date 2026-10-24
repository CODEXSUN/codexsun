# Codeit coding standards

These rules apply after implementation is authorized.
Read the root guide, governance, affected component documents, and public composition points first.

## Repository rules

- Work from `D:\workspace\codexsun` and preserve unrelated changes.
- Use npm from the repository root. Keep one root lockfile and dependency installation.
- Emit builds only under root `dist`. Keep runtime logs, caches, secrets, and agent output out of source control.
- Use `@codexsun/*` package names and `CODEXSUN_*` environment variables.
- Follow lockstep package versions. Bump versions only when requested.
- Read design-system, API, tenancy, migration, or deployment guidance when those areas change.
- Keep required README.md, agent/TASK.md, agent/PLAN.md, and agent/SKILLS.md accurate for each owner.
- Use the sole versioned changelog only for authorized release history.

## Module and code shape

Keep each entity's fields, storage, validation, lifecycle, routes, types, and UI in its leaf owner.
Backend CRUD leaves own module, migration, repository, service, routes, seed, types, and public index roles.
Add event, worker, and sync roles only for real behavior.
Frontend CRUD leaves own workspace, list, form, services, hooks, schema, types, and public index roles.
Document and enforce capability-specific exemptions for streaming, read-only, and execution infrastructure.
Extend the boundary checker when adding a new approved contract.

Use strict TypeScript and executable schemas. Avoid `any`, unchecked casts, and passthrough business payloads.
Use fixed public module contracts and injected dependencies. Avoid sibling private imports.
Do not create metadata-driven CRUD engines, arbitrary module paths, generic business repositories, or wrapper role files.
Keep functions focused and files below 300 lines when practical.
Prefer cohesive service classes where they clarify ownership. Do not add abstractions before repeated concrete use.
Put public orchestration before low-level helpers. Comments explain reasons and constraints.
Normalize errors at explicit boundaries. Never swallow failures or invent successful fallback data.

## Data and concurrency

Use internal integer identity and the repository's public `uuid` contract.
Use separate secret tokens for authorization.
Persist state changes, audit, and events transactionally where required.
Use unique constraints, optimistic revisions, idempotency keys, and lease fencing for concurrent operations.
Validate parents and cross-project ownership before writes.
Use parameterized queries and module-owned concrete SQL.
Version migrations and test both fresh setup and upgrade with retained data.
Add explicit safe-delete behavior and retention policy. Never depend solely on database errors.

## UI

Use `@codexsun/ui` controls, layout regions, workspace patterns, and theme tokens.
Keep business fields and behavior out of shared UI.
Use shared relationship lookup, select, banners, status badges, required markers, and lifecycle confirmations.
Provide loading, empty, denied, conflict, error, cancellation, and success states.
Keep keyboard focus, accessible names, pointer/disabled cursors, contrast, and responsive behavior testable.
Display dates in the repository format. Keep stored timestamps machine-readable.

## Tests and evidence

Test meaningful behavior, failure boundaries, and regression risk.
Do not add tests that merely copy implementation constants or existence checks for low-impact edits.
Use controlled provider doubles for deterministic tests and a separate real provider smoke gate.
Use disposable project fixtures, synthetic secrets, and disposable databases.
Never run destructive checks against the developer's project or live tenant database.
Record command, cwd, revision, exit code, observed behavior, and evidence path.
Report skipped checks and baseline failures separately from introduced failures.

## External effects

Treat plugin install, network exposure, credential access, message sending, deployment, Git push, and destructive actions as explicit boundaries.
Use existing authorization only within its actual scope.
Keep credentials out of logs, prompts, URLs, artifacts, and memory.
Do not weaken sandbox or permission checks to make a test pass.
