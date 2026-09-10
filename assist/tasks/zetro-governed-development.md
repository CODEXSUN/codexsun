# Zetro governed development workflow

## Release hold

Sites development is paused until this workflow passes installed-desktop acceptance.
This task is not complete. Existing execution completion must not be presented as feature acceptance.

## Ownership

- Chat owns discussion, ideas, refinement, review, and task drafts. It must not be the default implementation executor.
- Project Tasks owns durable objectives, source scope, acceptance criteria, parent/child relationships, and acceptance status.
- System Tasks owns individual execution attempts, cancellation, recovery, and durable run evidence.
- Automation coordinates attempts, verification, bounded repairs, approval gates, and delivery.
- Scripts perform allowlisted deterministic operations. They do not approve their own results.
- Humans accept the implementation and separately authorize release-sensitive actions.

## Target lifecycle

Draft -> ready -> queued -> preparing -> implementing -> verifying -> awaiting acceptance -> accepted.
Failed verification can enter repairing within the approved attempt and time budget, then return to verifying.
Blocked, cancelled, and failed are explicit outcomes. No restart silently repeats a coding attempt.
Accepted is not deployed. Delivery has separate integration, verification, publication, deployment, and smoke-test states.

## Required contracts

A task contains project, source owner, approved documentation roots, baseline revision, requirements, acceptance criteria, and named checks.
It also contains task dependencies, originating chat ID, plan revision, retry budget, and allowed operations.
Each execution records task ID, attempt ID, worktree, input revision, patch digest, tool versions, checks, artifacts, and timestamps.
Each approval records actor, action, task revision, patch digest, expiry, decision, and reason.
Changed inputs invalidate evidence and approvals. A model response cannot approve or mark verification green.
Submissions use idempotency keys. Locks cover source owners and shared build resources, not only chat IDs.

## Implementation phases and acceptance

1. Task integrity: reject cross-project parents and incomplete child completion. Keep legacy manual status distinct from verified acceptance.
2. Planning handoff: Chat produces a reviewed task draft. Implement a read-only planning execution path and remove coding from default Chat.
3. Workspace preparation: pin a revision, validate scope, prepare folders and isolated dependencies, and display readiness before coding.
4. Execution binding: Start task creates one durable System Task attempt and links its live output to the parent task.
5. Verification: scripts check the exact candidate revision. Store exit codes and evidence. Block on missing required checks.
6. Repair coordinator: inspect a failed attempt before retry. Enforce attempt/time limits and cancellation. Never expand permissions automatically.
7. Human acceptance: show requirements, diff, checks, and unverified items. Bind accept/reject to the reviewed candidate digest.
8. Delivery: integrate reviewed changes, revalidate, write release notes/version when selected, and commit only the reviewed files.
9. Publication/deployment: require separate approval, test isolated deployment, run smoke/recovery checks, then record completion.
10. Installed acceptance: prove planning cannot write, tasks can implement in scope, failures cannot appear green, and restart cannot duplicate changes.

## Current evidence

Phases 1 and 2 are source-complete: parent integrity is enforced, browser Chat defaults
to read-only Plan, and browser Chat rejects implementation workflows. A compliant plan
creates a task with criteria, checks, source scope, and its originating chat.
Phases 3 and 4 are source-integrated: explicit user Start creates one linked Supervisor
System Task attempt. It does not yet pin a candidate revision, synchronize check evidence,
coordinate repair, or provide human acceptance evidence.
Phases 5-10 remain open. Do not present a completed System Task as verified, accepted,
committed, published, or deployed.
The existing Supervisor and Git Delivery modules are reusable foundations, not proof that this coordinator exists.

## Test matrix

- Planning attempts to write, execute mutation tools, or bypass task creation are rejected.
- A duplicate submission creates one attempt. Restart does not replay ambiguous coding actions.
- Missing folders, stale revisions, missing dependencies, and occupied resources produce actionable preflight states.
- Failed checks, expired approval, changed patches, and unfinished children prevent progression.
- Independent owners may run in parallel. Shared dependency builds and integration are serialized.
- Human rejection returns work for revision. Changed evidence requires new approval.
- No commit, push, install, migration, or deployment happens without its specific authorization.
- An installed desktop completes one disposable non-business task through acceptance and records all evidence.

## Completion rule

Report complete only after all ten phases and installed acceptance pass.
Then notify the user and request the Sites task. Do not begin Sites automatically.
