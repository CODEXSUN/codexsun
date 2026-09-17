# Zetro Task Register

## Status

No Zetro task is active. A planned task does not authorize source, dependency,
migration, worktree, deployment, release, or Git changes.

## Next Task

| Task                                 | Owner | State                                 | Data impact        |
| ------------------------------------ | ----- | ------------------------------------- | ------------------ |
| Z-1203 Zetro model provider boundary | Zetro | Planned. Requires human confirmation. | Configuration only |

## Phase Register

| Phase                          | Tasks            | State                               | Approval gate                            |
| ------------------------------ | ---------------- | ----------------------------------- | ---------------------------------------- |
| Z0 Foundation decisions        | Z-1201 to Z-1204 | Active. Z-1201 and Z-1202 complete. | Architecture and execution policy review |
| Z1 Ideas and planning          | Z-1210 to Z-1213 | Planned                             | Z0 complete                              |
| Z2 Tasks and subtasks          | Z-1220 to Z-1223 | Planned                             | Z1 task model review                     |
| Z3 Guidance and review         | Z-1230 to Z-1233 | Planned                             | Z2 scope policy review                   |
| Z4 Worker and worktree control | Z-1240 to Z-1243 | Planned                             | Z3 worker-start gate review              |
| Z5 Review and test evidence    | Z-1250 to Z-1253 | Planned                             | Z4 lifecycle evidence review             |
| Z6 Deployment and manual merge | Z-1260 to Z-1263 | Planned                             | Z5 evidence and human approval review    |
| Z7 Operations and hardening    | Z-1270 to Z-1273 | Planned                             | Z6 deployment and merge review           |

## Required Task Fields

Every Zetro worker task must record:

1. Task ID, class, owner, reviewer, and backup owner.
2. Goal, scope, exclusions, expected files, and dependencies.
3. Data classification, SQLite impact, migration, backup, and rollback limits.
4. Repository base revision and explicit development-record path.
5. Assist paths, guidance snapshot hashes, and plan fingerprint.
6. Risks, open decisions, acceptance criteria, and named checks.
7. Worktree path, branch, worker attempt, and subworker task IDs.
8. Review, test, deployment, and manual-merge evidence.

## Worker Eligibility

Only a `single-scope` task may start a worker. The task needs a confirmed
human review, matching plan fingerprint, current guidance snapshot, explicit
development-record path, base revision, expected files, and named checks.

`planning-only`, `multi-scope`, and `release-controlled` tasks cannot start a
worker. A multi-scope task must produce ordered child tasks first.

## Completion Rule

Mark a task complete only after its acceptance criteria and required evidence
pass. A deployment or merge needs its own recorded manual approval. Do not
create a release or push to `main` from task completion alone.
