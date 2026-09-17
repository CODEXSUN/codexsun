# Zetro Agentic Delivery Plan

## Status

This plan defines the next Zetro delivery sequence. Zetro source work is not
authorized until a task in `zetro-task.md` is confirmed.

## Goal

Build Zetro as a CODEXSUN application that governs the path from idea to a
human-approved merge into `main`.

## Current Baseline

- `apps/zetro` contains API and web placeholders only.
- SQLite is the current connected and working storage baseline.
- No Zetro module, provider, public contract, migration, or worker runtime
  exists in this checkout.
- The application must use the common provider, package, storage, and UI rules.

## Required Flow

```text
idea → refinement → plan → task → subtask → guidance snapshot
     → human review → worker → optional subworker worktree → review
     → test suite → deployment rehearsal → manual approval → main merge
```

Chat supports idea and refinement work only. It cannot create a worker attempt
without the review and guidance gates.

## Architecture Boundaries

| Owner             | Responsibility                                                                        | Exclusion                                         |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Zetro API         | Workflow records, SQLite repositories, policy, dispatch, audit, and public contracts. | Product domain logic and unsafe direct execution. |
| Zetro web         | Workflow views, review controls, evidence, and approval UI.                           | Direct SQLite access and worker execution.        |
| Zetro agent skill | Role rules, gates, prompts, and safety constraints.                                   | Runtime authority or approval authority.          |
| Worker worktree   | One approved implementation scope.                                                    | Main merges, releases, and scope expansion.       |
| Platform Core     | Runtime, config, data, and provider contracts.                                        | Zetro workflow business rules.                    |

## Data Direction

The first Zetro persistence target is SQLite through Platform Core data
contracts. Zetro modules own their tables and migrations.

Initial record groups are:

| Record group       | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| Ideas              | Refinement history, outcome, and handoff decision.      |
| Plans              | Scope, exclusions, risks, checks, and plan fingerprint. |
| Tasks              | Class, owner, dependencies, status, and approval state. |
| Guidance snapshots | Paths, hashes, repository revision, and record path.    |
| Worker attempts    | Worktree, branch, lifecycle, and stop reason.           |
| Evidence           | Review, test, deployment, and merge results.            |
| Audit records      | State changes with actor and correlation information.   |

Do not create tables before the owning task is approved. Each data task must
include a migration, compatibility note, rollback limit, and SQLite tests.

## Delivery Phases

### Phase Z0: Foundation Decisions

Goal: approve the runtime and safety boundaries before source work.

- [ ] Z-1201 Confirm API and web host names, ports, provider IDs, and deployment profile.
- [ ] Z-1202 Confirm SQLite file location, backup owner, retention, and recovery check.
- [ ] Z-1203 Select the model provider boundary and secret configuration contract.
- [ ] Z-1204 Approve command, filesystem, network, and Git permission policies.

Exit: a reviewed decision record states the allowed execution boundary.

### Phase Z1: Ideas and Planning

Goal: keep conversational ideas separate from executable work.

- [ ] Z-1210 Add an Idea module with refinement and handoff records.
- [ ] Z-1211 Add a Plan module with scope, exclusions, risks, and acceptance criteria.
- [ ] Z-1212 Add task classes and a plan fingerprint.
- [ ] Z-1213 Add planning views that use public API contracts.

Exit: an idea can produce a planning-only task. It cannot start a worker.

### Phase Z2: Tasks and Subtasks

Goal: convert approved plans into bounded implementation scopes.

- [ ] Z-1220 Add a Task module with ordered dependencies and task classes.
- [ ] Z-1221 Add controlled multi-scope splitting into single-scope subtasks.
- [ ] Z-1222 Add task ownership, expected files, data impact, and verification fields.
- [ ] Z-1223 Add task graph and detail views.

Exit: a multi-scope parent cannot start a worker. Its ordered subtasks can.

### Phase Z3: Guidance and Review

Goal: give workers exact, current, reviewable task guidance.

- [ ] Z-1230 Require an explicit development-record path on every worker task.
- [ ] Z-1231 Add a guidance snapshot module with document hashes and base revision.
- [ ] Z-1232 Add plan confirmation with SHA-256 fingerprint invalidation on edits.
- [ ] Z-1233 Add reviewer decisions and stale-guidance blocking.

Exit: only a reviewed, fingerprinted, current single-scope task is eligible.

### Phase Z4: Worker and Worktree Control

Goal: run bounded implementation attempts in isolated Git worktrees.

- [ ] Z-1240 Add worker-attempt lifecycle records and state policy.
- [ ] Z-1241 Add worktree and branch creation through a controlled adapter.
- [ ] Z-1242 Add subworker dispatch that requires an approved child task.
- [ ] Z-1243 Add stop, retry, timeout, cleanup, and recovery rules.

Exit: each attempt has one task, one snapshot, one worktree, and one audit trail.

### Phase Z5: Review and Test Evidence

Goal: record whether a worker result matches the approved task.

- [ ] Z-1250 Add diff and scope review records.
- [ ] Z-1251 Add named test-suite execution and evidence records.
- [ ] Z-1252 Add browser, database, Docker, and target-specific evidence types.
- [ ] Z-1253 Add failure, retry, and unresolved-finding controls.

Exit: Zetro distinguishes passing static checks from complete user-flow proof.

### Phase Z6: Deployment and Manual Merge

Goal: support rehearsals and human-controlled integration.

- [ ] Z-1260 Add deployment rehearsal plans and redacted evidence.
- [ ] Z-1261 Add manual deployment approval records.
- [ ] Z-1262 Add merge readiness checks and manual merge approval records.
- [ ] Z-1263 Add protected `main` integration through a reviewed Git adapter.

Exit: no agent can deploy, release, tag, push, or merge without approval.

### Phase Z7: Operations and Hardening

Goal: make the workflow observable, recoverable, and safe to operate.

- [ ] Z-1270 Add structured audit logs, metrics, correlation IDs, and readiness.
- [ ] Z-1271 Add SQLite backup, restore, retention, and recovery evidence.
- [ ] Z-1272 Add permissions, secret redaction, rate limits, and incident controls.
- [ ] Z-1273 Add end-to-end workflow coverage and deployment-profile checks.

Exit: a complete governed workflow has reproducible evidence and recovery notes.

## Cross-Phase Rules

1. Keep every implementation task single-scope.
2. Use module-owned providers, repositories, migrations, tests, and READMEs.
3. Use `@codexsun/ui` public exports in the web host.
4. Store only safe configuration in the web host.
5. Treat model output as untrusted advisory input until reviewed.
6. Never expose secrets in prompts, logs, evidence, or browser configuration.
7. Do not claim deploy or production proof from a source or static check.

## Verification Plan

Each implementation task names focused module tests, TypeScript checks, lint,
boundary checks, `git diff --check`, and target-specific proof. Worker, SQLite,
browser, deployment, and merge behavior each require separate evidence.

## Open Decisions

1. Model provider, model policy, limits, and fallback behavior.
2. Exact SQLite location, encryption need, backup schedule, and restore owner.
3. Worktree directory policy and branch retention policy.
4. Approval roles and whether one person may approve plan, deployment, and merge.
5. Deployment target, release policy, and protected-branch requirements.
