# ZCode Automation and Governance Design

Status: planned, not implemented. Parent: [planning.md](planning.md). Work: [task.md](task.md).
This document holds execution details and the M4 team-automation extension.

Execution order comes from task.md, not numeric sorting of task IDs.
Build the single-workspace runner in Phase 6 and remote control in Phase 6A.
After M3, complete organization controls in Phase 14 before catalog sharing in Phase 13.
Then complete cross-repository execution in Phase 15 and automated review acceptance in Phase 16.

## Approved task.md automation

A developer can request: “Run task.md phases 4 through 6 in phase and task order until complete.”
The request selects a file and scope. Execution starts after an authorized approval of the resolved execution manifest.
The approval action may follow a preview in the task UI or an explicit developer confirmation in chat.

The TaskDocument adapter reads a workspace-relative Markdown path through authorized file access.
It extracts stable task IDs, phase headings, checkbox states, ordering, and declared dependencies.
Resolve links relative to the document without granting access outside the workspace.
Support IDs such as 3A.22a and 6.9i. Preserve source order instead of numeric or alphabetical guessing.
Reject duplicate or missing IDs in the selected executable scope and report ambiguous instructions before execution.
Document content provides work instructions; it cannot approve itself or grant tool permissions.

Create a versioned AutomationPlan containing document path/hash, task mappings, selected phases,
explicit task order, prerequisite closure, verification gates, backend profile, and completion target.
Include workspace/repository binding, execution limits, allowed actions, approver, and approval expiry.
Treat the task file as an import and progress surface; database task/run records remain execution authority.
Use an import mapping keyed by workspace, project, document identity, and stable task ID to prevent duplicate tasks.

Show a preview of included tasks, excluded tasks, unresolved prerequisites, and intended file changes before approval.
Do not silently expand a selected phase range to execute prerequisites outside that range.
Require those prerequisites to be satisfied or include them in a revised approval.
If requested order conflicts with blocking dependencies, present the conflict rather than running out of order.
Default to sequential execution with one write-capable run per checkout.

AutomationExecution records the approved plan, cursor, child task/run IDs, checkpoint, and result.
After approval, the runner claims the next eligible task and starts its agent run.
It verifies acceptance evidence, satisfies required review, marks the task DONE, and advances the cursor.
Each item retains separate attempt history. Failed attempts use bounded repairs before requesting developer input.
Runner states are awaiting approval, running, paused, blocked, completed, cancelled, and failed.
Paused, blocked, cancelled, and failed executions never count as completion.

Approval authorizes dispatch within the agreed scope, not blanket acceptance of generated work.
Define which review gates require a human and which routine transitions may proceed automatically.
Human-required plan or final review pauses execution at that gate.
The developer can choose “continue through approved tasks” when the configured review policy permits it.
Recheck workspace permissions and approval validity before every task and side effect.
Commits, pushes, deployments, and destructive actions require their own applicable permissions and scope.

Persist progress across API restarts and editor disconnects using a durable worker lease and checkpoint.
Resume at the first incomplete approved item after reconciling uncertain effects.
Apply per-task and whole-execution time, cost, retry, and tool limits.
Pause and cancellation stop dispatch and propagate to the active backend and its processes.
Revocation prevents new actions immediately and stops active execution at the enforced runtime boundary.

Check a task.md checkbox only after its mapped task passes its completion gates.
Use a compare-and-swap document update and preserve unrelated text and formatting.
Record runner-authored checkbox changes as expected progress, with before/after hashes.
Other edits to selected instructions, criteria, order, or dependencies invalidate affected approval.
Pause and preview the changed execution manifest before continuing under renewed approval.
Reject prechecked items without trusted completion evidence; report them for reconciliation rather than rerunning silently.
If checkbox synchronization fails, retain database progress and expose the pending sync conflict.
Do not report the automation complete until every selected item passes and requested progress synchronization succeeds.

Show phase progress, current item/run, approval scope, budget, blockers, and evidence in the task UI.
Produce a final summary with completed, failed, blocked, skipped, and untested items.
Never equate exhausting the task list or stopping the agent with verified completion.

## Trigger and control work from mobile or laptop

Use the same versioned API from a responsive browser, laptop CLI, or authorized API client.
Execution stays on the workspace server and continues when the device disconnects.
Start with responsive task controls; a native mobile app and full phone editor are later work.
Remote access requires an authenticated HTTPS gateway or private network; keep runtime ports private.
The existing localhost-only demo must not be exposed unchanged.

| Proposed endpoint under /api/v1/zcode         | Behavior                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| POST /tasks/{taskId}/runs                     | Start one authorized task run with an idempotency key.                         |
| POST /automation-plans                        | Resolve taskDocumentPath, phaseIds, orderedTaskIds, and limits into a preview. |
| POST /automation-plans/{id}/approvals         | Approve the exact manifest revision and digest.                                |
| POST /automation-executions                   | Start the approved plan with an idempotency key.                               |
| GET /runs/{id} or /automation-executions/{id} | Fetch durable status, progress, blockers, and evidence links.                  |
| POST /automation-executions/{id}/actions      | Request pause, resume, or cancel with the expected state revision.             |

Provide equivalent run actions and an authenticated event stream with reconnect cursors and polling fallback.
Return 202 and stable operation/status references only after durable dispatch acceptance; completion remains asynchronous.
Scope idempotency to actor, workspace, and operation; reject reuse with different request content.
Browser sessions use protected cookies and CSRF controls; API clients use revocable, scoped credentials.
Enforce approval, workspace membership, rate limits, and audit identity equally on every device.
Use state revisions to resolve conflicting phone/laptop actions; never accept last-write-wins approval changes.
Show approval scope and diff before confirmation, then current task, phase, budget, and required developer actions.
Test phone-trigger/laptop-review, retry after connection loss, revoked credentials, and conflicting controls.

## Shared definitions and successful patterns

AutomationDefinition stores an immutable version, owner, purpose, input schema,
supported repositories, workflow graph, required capabilities, verification plan, and compatibility constraints.
AutomationBinding supplies recipient workspace, repository, branch, secret references, team, and allowed budgets.
AutomationExecution pins a definition version and binding, then links tasks and their runs.
Editing a definition creates a new version; it never changes active executions.

Offer “Create automation from task” for selected tasks with successful verification evidence.
Extract steps, inputs, constraints, acceptance checks, and useful context into a draft.
Remove credentials, private conversation content, absolute paths, and incidental repository values.
Preserve source task/run provenance and parameterize repository-specific assumptions.
Review the generated draft before adding it to the catalog.

Use draft, validated, published, deprecated, and revoked definition states.
Published versions include owner, changelog, examples, required grants, and evaluation results.
Evaluate success rate, human corrections, failure modes, duration, cost, and false-positive review findings.
Use representative fixtures from more than one repository before declaring a pattern broadly reusable.
Sharing is an access-controlled catalog reference, not repeated prompt copying.
Recipients bind their own authorized resources; required permissions are visible before activation.
Allow users to pin or roll back versions and show upgrade differences.
Revocation prevents new runs and pauses affected active workflows according to recorded policy.

## Cross-repository and team workflows

An organization groups teams; each team membership has an identity-provider-backed source.
Workflow nodes target a registered workspace/project/repository and name their accountable owner.
Edges express prerequisite evidence or explicit team handoff.
Validate the expanded workflow graph for cycles before approving execution.
A template cannot infer access to another team's repository.

Resolve grants separately for every node, artifact read, event subscription, and output transfer.
Share only explicitly permitted evidence between nodes.
Use scoped service identities for scheduled or API-triggered execution.
Keep approvals attributable to a human or organization-authorized automation policy.
Use one execution branch or checkout per node with write leases and pinned source revisions.
Start sequentially, then permit concurrency only for independent nodes with isolated writable scopes.

Example: Team API validates a schema change, then Team Web implements its consumer,
then an integration task tests both pinned revisions.
Passing one repository's checks does not imply the full workflow passes.
Retain successful node evidence after partial failure; pause dependent nodes and expose recovery options.
Any compensation action requires an explicit plan and appropriate permissions.
Do not merge, revert, or delete branches merely to make workflow state appear consistent.

## Usage, budgets, and organization policy

Apply organization, team, workspace, user, automation, and run constraints together.
Effective permissions are their intersection; explicit restrictions win.
Separate allowed models, tools, repositories, branches, paths, secrets, network destinations,
runtime profiles, data retention, and mandatory review requirements.
Changes require an authorized administrator and a new auditable policy revision.

Track model tokens, provider-reported cost, compute time, storage, browser time, and concurrency.
Attribute usage to execution, run, user/service identity, team, and organization without double counting.
Mark estimated, reported, and unknown costs distinctly.
Reserve estimated allowance atomically before parallel work; reconcile actual usage afterward.
Hard-budget operation requires bounded requests or conservative reservation where providers lack precise metering.
Expose reporting delays and prevent new work when remaining allowance cannot cover its bound.
Use soft alerts, hard dispatch stops, rate limits, time windows, and explicit reset rules.
Apply policy changes and access revocation to active work, not only future starts.

Provide usage summaries, budget forecasts, limit events, and exportable attribution.
Record an administrator-approved exception with scope and expiry; never create a silent budget bypass.
Reuse available public policy contracts and implement only ZCode-owned accounting behavior.

## Audit and access coverage

Audit authentication, authorization decisions, task edits, approvals, template changes,
workflow transitions, model dispatch, tool calls, file changes, reviews, usage, and administrative actions.
Record allowed and denied operations, including direct editor/terminal entry and file effects.
Correlate actor/service identity, workspace, team, policy revision, approval, task, workflow,
run, tool call, source revision, timestamp, and result.

Use append-only records with sequenced IDs, durable writes, integrity checks, and authorized retention controls.
Do not log passwords, API keys, raw sensitive prompts, or terminal secrets.
For free-form terminal sessions, record lifecycle and observable effects and declare command-level visibility limits.
Never claim every subprocess action is audited unless runtime instrumentation proves that coverage.
Gate high-impact mutations on durable audit acceptance; queue read telemetry with bounded failure reporting.
Provide access-controlled search and export, evidence integrity validation, and missing-event alerts.
Audit access to audit records and exports themselves.

Before each action, intersect the agent's declared capabilities with the initiating identity's
grants, current workspace policy, organization restrictions, and approved workflow scope.
A model choice, skill, MCP server, team assignment, or shared template cannot expand authority.

## Automated code review

Add review as a workflow step that uses the existing backend contract with a read-only review profile.
No separate autonomous reviewer agent is required for the first implementation.
Review the exact diff against repository standards, task requirements, and acceptance criteria.
Combine lint, types, tests, boundary checks, and configured security analysis with model-assisted inspection.
Return findings with severity, file/line, evidence, suggested correction, and check provenance.
Distinguish deterministic check failures from model suggestions; deduplicate overlapping findings.

Persist a ReviewRun linked to the task, source revision/diff digest, standards version, and tool/model versions.
Use the normal Agent Run when a model performs review; link deterministic check results separately.
Never modify code or publish external comments as an implicit review side effect.
A repair starts a separate authorized coding attempt and invalidates affected review attestations.
Recheck changed revisions and retain prior findings and human dispositions as history.
Enforce required checks and severity thresholds from organization policy.
Require human review where configured; keep override reasons attributable and auditable.
Test seeded correctness bugs, missing tests, boundary violations, prompt injection, false positives, and stale diffs.
Validate quality on known fixtures before making a model-generated finding a blocking team-wide gate.
