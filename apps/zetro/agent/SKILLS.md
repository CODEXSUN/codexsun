# Zetro Agent Skills

## Purpose

Use these skills to build and operate Zetro. Zetro is a governed agentic IDE
for CODEXSUN delivery work. It converts an idea into a reviewed change without
allowing chat text to execute repository work.

## Scope

Zetro owns these workflow records:

1. Idea and refinement records.
2. Plans, tasks, subtasks, and dependencies.
3. Guidance snapshots and review decisions.
4. Worker and subworker attempts.
5. Worktree, test, deployment, and merge evidence.
6. Manual approval and audit records.

Zetro does not own product code, product databases, product deployment state,
or unrestricted command execution.

## Required Terms

Use these names consistently.

| Term              | Meaning                                                           |
| ----------------- | ----------------------------------------------------------------- |
| Idea              | A discussion record. It cannot start a worker.                    |
| Plan              | A proposed outcome, scope, exclusions, risks, and checks.         |
| Task              | A planned unit of delivery work.                                  |
| Subtask           | A dependent child task with one smaller scope.                    |
| Guidance snapshot | A hashed record of exact documents and repository revision.       |
| Review            | A human decision on a plan and its snapshot.                      |
| Worker attempt    | One bounded execution attempt for one approved task.              |
| Subworker         | A worker delegated one bounded child activity.                    |
| Worktree          | An isolated Git checkout for a worker attempt.                    |
| Evidence          | A dated result from a named verification command or manual check. |
| Merge approval    | A human approval to integrate a reviewed change into `main`.      |

## Agent Roles

| Role             | May do                                                 | Must not do                                     |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Idea agent       | Clarify goals, constraints, and open decisions.        | Start a task or worker.                         |
| Planner          | Draft a plan and task graph.                           | Confirm its own plan.                           |
| Task splitter    | Split multi-scope work into ordered tasks.             | Create overlapping child scopes.                |
| Guidance agent   | Collect and hash approved guidance.                    | Guess a development record path.                |
| Reviewer         | Check scope, risks, acceptance criteria, and guidance. | Modify the reviewed plan.                       |
| Worker           | Change only its approved task scope in its worktree.   | Merge, deploy, or change task approval.         |
| Subworker        | Complete one assigned bounded activity.                | Spawn further work without an approved subtask. |
| Test agent       | Run approved checks and store evidence.                | Mark a failed check as passed.                  |
| Deployment agent | Run a rehearsal or selected deployment check.          | Release or change production without approval.  |
| Merge agent      | Prepare merge evidence and conflicts.                  | Merge into `main` without manual approval.      |
| Human approver   | Confirm plans, deployments, and merges.                | Delegate approval authority to an agent.        |

## Mandatory Workflow

```text
idea → refinement → plan → task graph → guidance snapshot
     → human review → worker worktree → review → test suite
     → deployment rehearsal → manual approval → merge to main
```

1. Keep chat output in the idea or refinement stage.
2. Create a plan before a task.
3. State the owner, exact module scope, exclusions, risks, rollback notes,
   expected files, data impact, and named verification checks.
4. Split multi-scope work into ordered single-scope tasks.
5. Require an explicit development-record path for each task.
6. Create a guidance snapshot after the task details are complete.
7. Record the repository revision and SHA-256 hash for every guidance file.
8. Require a human reviewer to confirm the plan fingerprint.
9. Clear the review confirmation if a reviewed plan changes.
10. Start one worker attempt only for a confirmed single-scope task.
11. Create an isolated worktree and branch for that attempt.
12. Run the named tests and store their exact results.
13. Run a deployment rehearsal when the task affects a deployable target.
14. Require a human approval before merging into `main`.

## Task Classes

| Class                | Worker allowed | Rule                                                    |
| -------------------- | -------------- | ------------------------------------------------------- |
| `planning-only`      | No             | It can create plans and decisions only.                 |
| `single-scope`       | Yes            | It needs reviewed guidance and a plan fingerprint.      |
| `multi-scope`        | No             | Split it into ordered single-scope subtasks first.      |
| `release-controlled` | No             | A human must create separately reviewed delivery tasks. |

## Worker Start Gate

A worker attempt starts only when all conditions pass.

1. The task class is `single-scope`.
2. The task has one named owner and exact module boundary.
3. The task has a base repository revision.
4. The task has an explicit development-record path.
5. The guidance snapshot contains current file hashes.
6. The plan fingerprint matches the reviewed plan.
7. The review status is confirmed by a human.
8. The task has named acceptance criteria and checks.
9. The worktree target and branch name are recorded.

Block the attempt when any condition fails. Show the failing condition and the
record that needs correction.

## Guidance Snapshot Skill

The guidance agent must collect only documents that apply to the task. Include
the repository revision, absolute or repository-relative path, SHA-256 hash,
and collection time for each document.

Collect these when applicable:

1. Root `AGENTS.md` and root README.
2. `assist/README.md`, governance, architecture, execution, and operations guides.
3. The owner application, package, and module README files.
4. The active task, plan, decision record, and development record.
5. Target contracts, configuration examples, and deployment profile.

Reject a snapshot when a required path is missing, its hash changed after
review, its repository revision differs, or its task scope differs.

## SQLite Skill

SQLite is the current Zetro storage baseline. Access it only through Zetro
module repositories and the Platform data contracts. Do not let the web host,
worker prompt, or another application write SQLite files directly.

Each data-owning Zetro module must provide a migration, repeat-safe seeder when
needed, lifecycle record, repository tests, and backup or rollback limits.
Run clean-database, upgrade-database, and repeat-seed checks before declaring
a data task complete.

## Worktree and Subworker Skill

Create one branch and one isolated worktree per worker attempt. Record the
base revision, worktree path, branch, worker identity, start time, and stop
reason. A worker may create a subworker only from an approved subtask.

A subworker receives only its child scope, guidance snapshot, expected files,
and checks. It cannot change parent approval, access another worktree, merge,
deploy, or expand the task scope.

Stop a worker when its scope changes, its snapshot becomes stale, a required
check fails without an approved recovery path, or a human requests a stop.

## Review and Test Skill

The review agent compares the diff with the approved task. It records scope
compliance, boundary compliance, security risks, data impact, rollback notes,
and unresolved findings.

The test agent records each command, environment, time, exit result, and
limitation. Static checks do not prove browser, database, worker, Docker, or
deployment behavior. Label each untested target clearly.

## Deployment and Merge Skill

The deployment agent runs only the rehearsal or deployment action named in the
approved task. It redacts secrets from evidence. It cannot publish a release,
change production, tag, push, or merge without explicit human approval.

The merge agent requires a reviewed diff, passing required evidence, a clean
merge target, and a recorded human merge approval. It must not merge to `main`
when the worktree contains unrelated changes or an unresolved finding.

## Required Audit Fields

Record actor, action, target, outcome, correlation ID, timestamp, repository
revision, task ID, and worker-attempt ID for every state-changing workflow
action. Never store prompts that contain secrets, credentials, or private keys.

## Completion Rule

Mark a task complete only after the required review, test, deployment, and
manual-approval gates pass. A merged change is not proof of a production
release. Record deployment proof separately.
