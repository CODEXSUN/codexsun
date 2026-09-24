# Zetro2 Daily Coding Platform Plan

## 1. Outcome and status

Build Zetro2 as a daily coding environment with authenticated workspaces,
a customized ZVcode editor, and one chat for multiple models and agent backends.
Support repository understanding, planning, editing, execution, testing, repair,
review, and resumable work.

Status: proposed implementation architecture, revised 2026-09-24.
This revision changes planning documents only. Source import, SDK integration,
identity enforcement, and E2E execution remain implementation tasks.
Use [task.md](task.md) for numbered work and progress evidence.
The [architecture notes](architecture-notes.md) remains the source of the core engine concepts.
This plan updates its UI, identity, integration, and delivery sequence.

## 2. Verified starting point and new application boundary

Zetro2 is a new app at `devkits/zetro2/`; its runtime remains unimplemented.
ZVcode source is now imported at `devkits/zetro2/zvcode` with product identity configured.
See [source integration](../editor/README.md) for verified scope and remaining build work.
OpenVSCode source exists at `apps/temp/openvscode-server` with native chat and inline-chat components.
The existing ZCode Docker demo provides a reference for editor, workspace, and Zbrowser integration.
Copy source into Zetro2 and customize it directly; do not depend on a pinned upstream editor image or release.
Record source provenance and build revisions for diagnosis without freezing the product to an upstream version.
Retain upstream license notices; keep Zetro2-authored product source private and owned under this app.

[Architecture notes](architecture-notes.md) define the current source ownership and private Docker environment.
They supersede inherited ZCode deployment and editor-version assumptions.

## 3. Product scope and delivery order

1. Establish identity, roles, membership, and enforceable workspace access.
2. Import and build the OpenVSCode source with controlled Zetro2 customization.
3. Establish projects, epics, milestones, and evidence-backed tasks before connecting native chat to execution.
4. Deliver a complete coding loop through direct models and OpenCode.
5. Add OpenHands, language intelligence, repository skills, MCP, and browser tools.
6. Prove daily reliability, recovery, upgrades, and isolation.

The first authenticated editing milestone needs no autonomous agent.
The first agent milestone must work through the real editor in a Docker workspace.
Later milestones add richer tools without replacing the permission or history model.

## 4. Ownership and source layout

Zetro2 owns product behavior. Reuse public Framework and Platform Core capabilities
for identity, sessions, storage, secrets, and database composition where they fit.
Do not import private platform identity files or duplicate shared authentication.
Use central UI exports for new React surfaces. Preserve native workbench components
for editor integration rather than rebuilding the editor in React.

Proposed layout:

```text
devkits/zetro2/
  agent/                       architecture, plan, task register
  api/src/modules/
    workspace-access/          memberships, roles, grants, audit
    work-management/           projects, epics, milestones, tasks, reviews, decisions
    knowledge/                 Memory Bank documents, versions, review, retrieval
    coding/                    sessions, runs, workflow, context, execution evidence
    integrations/              model, backend, MCP, skill adapters
    workspace-runtime/         files, commands, sandbox and browser adapters
  zvcode/                  locally owned customized editor source
  editor/                     Zetro2-owned editor integration and source-change map
  zbrowser/                   registered development targets and private preview management
  .container/                 builds, runtime services, lifecycle scripts
storage/apps/private/zetro2/    scoped state and artifacts through storage providers
dist/zetro2/                   build and verification output
```

Each API module owns its provider, contracts, routes, services, repositories,
migrations, events, and tests. The `agent/` folder is not a second nested monorepo.
Keep vendor SDKs outside domain code. Extract shared packages only for proven consumers.

The upstream editor has its own build conventions and large source files.
Document a narrow vendor-source exception before import and build integration.
Do not silently apply vendor exceptions to Zetro2-authored files.
Keep authored files within 700 lines and generated output in root `dist/`.
Resolve upstream dependency layout through a reproducible container build contract.
Do not run upstream installation scripts in the host source tree.

## 5. Identity and workspace permissions first

Use an identity adapter backed by an existing public provider where possible.
Start with one deployment and workspace-scoped memberships.
Do not claim multi-tenant isolation from a tenant identifier alone.

| Role       | Workspace read | Modify code   | Execute tools | Review and approve | Manage membership   |
| ---------- | -------------- | ------------- | ------------- | ------------------ | ------------------- |
| Owner      | Yes            | Yes           | Policy-scoped | Policy-scoped      | Yes                 |
| Maintainer | Yes            | Yes           | Policy-scoped | Assigned approvals | Assigned workspaces |
| Developer  | Yes            | Yes           | Policy-scoped | Own change review  | No                  |
| Reviewer   | Yes            | No by default | No by default | Assigned approvals | No                  |
| Viewer     | Yes            | No            | No            | No                 | No                  |

Roles are presets for capabilities, not hard-coded route branches.
Define `workspace.read`, `workspace.write`, `process.execute`, `agent.run`,
`change.approve`, `git.commit`, `git.push`, `provider.manage`,
`mcp.manage`, `browser.use`, `computer.use`, and `membership.manage`.
Scope grants to a workspace and, when needed, a path or execution profile.

Authorize HTTP requests, WebSocket connections and subscriptions, editor saves,
file downloads, terminal access, extension installation, preview access, and backend tools.
Validate membership server-side. Never trust workspace IDs supplied by the client.
Use an authenticated gateway with private upstream editor and backend ports.
Use short-lived workspace credentials and secure browser sessions.

Readonly roles need readonly filesystem mounts and no writable terminal or extension host.
A disabled Save button is insufficient. Writable extensions must remain inside a
developer's isolated workspace and cannot access other users' volumes or credentials.
Revocation must close active sessions, stop affected runs, and invalidate queued approvals.
Bind approval to actor, workspace, action arguments, patch digest, and expiration.
Recheck permission immediately before a side effect.

## 6. OpenVSCode import and custom layers

Copy source from `apps/temp/openvscode-server` to `devkits/zetro2/zvcode`
after an inventory and destination conflict check.
Preserve the source clone. Exclude nested Git metadata, dependencies, caches,
build output, secrets, and local runtime data.
Record upstream URL, exact revision, source checksums, licenses, and local modifications.
Record the import provenance; the customized Zetro2 source becomes the maintained editor implementation.

Keep four explicit custom layers:

1. Product layer: Zetro2 name, icons, settings, menus, and built-in extension configuration.
2. Access layer: authenticated editor session, workspace attachment, and permission state.
3. Chat layer: native chat, provider selection, context, tool cards, approvals, and edit review.
4. Runtime bridge: typed HTTP commands and resumable WebSocket events from the Zetro2 API.

Prefer extension points where they satisfy the required behavior.
Refactor the locally owned workbench source where hooks are required.
Maintain a source-change map and compatibility tests; upstream merges are explicit maintenance choices.
Switch the editor image to the verified source-built artifact after parity tests pass.
Keep previous Zetro2-built images available for rollback without deleting workspace volumes.

## 7. One chat, multiple providers and backends

Refactor the Copilot-style chat experience through the native chat and inline-chat surfaces.
Inspect the upstream Copilot Chat extension separately before reusing its implementation.
Record source licenses, API compatibility, service dependencies, and branding requirements.
Do not assume a copied extension supplies GitHub service credentials or entitlement.

The shared chat contains task history, files and selections, diagnostics, plans,
tool output, approvals, diffs, test results, and resumable runs.
Provide Ask, Plan, and Code modes with enforced capability limits.
Show the selected model and execution backend separately.
Allow model changes between turns in one conversation.
Serialize a normalized context snapshot for each provider.
Do not transfer opaque provider session state as if it were portable.

| Integration                        | Architectural role               | Planned use                                                  |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| OpenAI, Anthropic, Gemini, Ollama  | Model adapters                   | Direct generation, streaming, tool proposals                 |
| OpenCode                           | Agent backend through SDK/server | Provider selection and coding sessions in the same chat      |
| OpenCode-hosted model services     | Optional model adapter           | Only when their explicit API and account are configured      |
| OpenHands Software Agent SDK       | Agent backend                    | Sandboxed coding, tools, conversation and execution events   |
| LangGraph JavaScript               | Workflow adapter                 | Stage transitions, interruptions, checkpoints, recovery      |
| LangChain JavaScript               | Optional integration helpers     | Model or retrieval adapters where they reduce custom code    |
| MCP                                | Tool integration protocol        | Approved external tools and resources                        |
| Agent Skills and repository skills | Context and procedure packages   | Versioned instructions and explicitly invoked tool workflows |

OpenCode is not itself a single foundation model.
Expose it in the same provider/backend settings while retaining this distinction.
Use its SDK/server session interface rather than scraping terminal output.
Use a TypeScript or REST bridge to a pinned OpenHands Agent Server.
The OpenHands runtime may require Python inside its service image.
Keep the Zetro2 API and core contracts in TypeScript.

LangGraph owns the outer engineering workflow through a Zetro2 `WorkflowEngine` port.
Exactly one backend owns the inner model/tool loop for each run.
Native, OpenCode, and OpenHands execution are alternatives at that boundary.
Do not nest their autonomous loops or let them race over the same files.
Use LangChain components selectively. Do not introduce another orchestration loop.

## 8. Contracts, execution, and state

Define Project, Epic, Milestone, Task, Agent, Session, Conversation, Run, Workflow, Context, ModelProvider,
AgentBackend, Tool, Workspace, Policy, Approval, Event, and Checkpoint contracts.
Validate external messages with versioned Zod schemas.

### 8.1. Workspace and project hierarchy

```text
Workspace
  └── Project
        ├── Epic
        │     ├── Task
        │     │     ├── Subtask
        │     │     └── Agent Run
        │     └── Task
        └── Milestone
```

A workspace is the access boundary. A project groups delivery work and repository references.
An epic groups related tasks. A milestone defines a target outcome, date, and linked work.
Milestones link tasks or epics within the project; they do not duplicate or own those records.
Allow tasks without an epic for small daily changes.

A subtask uses the same Task schema and lifecycle, with a parentTaskId.
Each task has at most one parent and belongs to one project and workspace.
Reject parent cycles, blocking-dependency cycles, and cross-project parent relationships.
Initially restrict task dependencies to the same project.
Dependencies describe prerequisites; parent links describe decomposition.

One task can have many agent runs across providers, retries, and coding sessions.
Each run belongs to exactly one task or subtask and records its execution workspace.
Distinguish the logical Workspace from a runtime checkout or container instance.
Projects can register multiple repositories, but each coding task targets one repository initially.
Use separate dependent tasks for changes across repositories.

The work-management module owns hierarchy, task records, lifecycle, reviews, and decisions.
The coding module owns runs and publishes verification and change evidence through public contracts.
Neither module writes the other's tables. Task completion validates the referenced evidence.

### 8.2. Complete task record

| Field               | Contract and behavior                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Identity            | Immutable internal ID and project-unique display key, such as TASK-1024; creator, timestamps, and revision.      |
| Description         | Title, problem, intended outcome, and scope exclusions.                                                          |
| Requirements        | Versioned requirement IDs with expected behavior and constraints.                                                |
| Acceptance Criteria | Individually identified, testable conditions linked to requirements and evidence.                                |
| Priority            | Urgent, High, Normal, or Low; independent of status and scheduling readiness.                                    |
| Status              | One canonical lifecycle state with transition actor, time, and reason.                                           |
| Assignee            | Typed Human or Agent assignment initially; reserve Team assignment for later. Retain an accountable human owner. |
| Dependencies        | Typed prerequisite links and derived unmet blockers.                                                             |
| Parent / Child      | ParentTaskId and derived child references; no duplicated child records.                                          |
| Repository          | Registered repository ID and permitted path scope.                                                               |
| Branch              | Target/base branch, execution branch or checkout, and immutable base/result revisions per run.                   |
| Context             | Versioned rules, files, selections, diagnostics, skills, and conversation references with provenance.            |
| Agent Runs          | Linked run IDs, backend, model, initiator, attempts, timing, and outcomes.                                       |
| Files Changed       | Run-linked paths, base/result hashes, diff artifacts, and attribution.                                           |
| Tests               | Command, environment, revision, exit result, and affected acceptance criteria.                                   |
| Reviews             | Reviewer, reviewed revision or diff digest, findings, verdict, and timestamp.                                    |
| Decisions           | Append-only rationale, alternatives, author, and superseding decision references.                                |
| Evidence            | Criterion-linked logs, test reports, traces, screenshots, diffs, and review references.                          |

Draft tasks may omit execution details. READY requires an assignee, scope,
testable criteria, resolved prerequisites, and a registered repository for coding work.
Resolve the execution branch and base revision before starting a write-capable run.
Revalidate readiness at dispatch because permissions and dependencies can change.
Assignee and priority never grant workspace permissions.
Use optimistic revisions to prevent silent concurrent task updates.

### 8.3. Board and detailed lifecycle

The daily board displays `Todo → Doing → Done`.
Derive board columns from the canonical status; do not persist a second mutable status.

```text
BACKLOG → READY → IN PROGRESS → PLANNING → IMPLEMENTING → VERIFYING → REVIEW → DONE
```

| Board column | Detailed states                                        | Meaning                                                  |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------- |
| Todo         | BACKLOG, READY                                         | Work is being defined or is eligible to start.           |
| Doing        | IN PROGRESS, PLANNING, IMPLEMENTING, VERIFYING, REVIEW | Work has been claimed and is underway.                   |
| Done         | DONE                                                   | Required criteria, verification, and review have passed. |

IN PROGRESS means the task is claimed and context discovery has started.
PLANNING records the proposed approach. IMPLEMENTING starts only after required approval.
VERIFYING gathers acceptance evidence. REVIEW checks the resulting change and evidence.
DONE requires every required criterion, blocking prerequisite, and child task to be satisfied.
Require the assigned review policy to pass for the current revision.
A completed agent run or successful command alone cannot complete the task.

Failed verification returns to IMPLEMENTING; requested review changes return to PLANNING or IMPLEMENTING.
Reopening DONE requires an authorized reason and invalidates completion evidence for changed scope.
Requirement or code changes invalidate affected test and review attestations.
Preserve old evidence as history instead of deleting it.

Represent blocked work with blocker links and reasons while retaining its lifecycle state.
Pause, failure, and cancellation are run states, not successful task completion.
Archive abandoned tasks with a reason; exclude them from active boards without marking them DONE.
Dragging a board card invokes a validated transition, including the same readiness and completion guards.

Map workflow discovery to IN PROGRESS, planning to PLANNING, edits to IMPLEMENTING,
tests to VERIFYING, and review to REVIEW. The task service owns status transitions.
LangGraph and backends submit transition requests with evidence through that service.
Task authority remains stable when the model or execution backend changes.

### 8.4. Task-centered daily interface and permissions

Add a project tree, epic view, milestone view, three-column board, and task detail panel.
Show the detailed status badge inside each board card.
Task details expose the complete record, dependencies, child tasks, linked chat,
run history, changed files, tests, reviews, decisions, and criterion-level evidence.
Chat can draft a task and attach context; task creation does not start execution.
Allow explicit task creation or linking before a write-capable chat run starts.
Keep plain Ask conversations available without creating delivery tasks.

Add scoped task.read, task.create, task.edit, task.assign, task.transition,
task.review, and project.manage capabilities to workspace role presets.
Limit task records, search, event streams, and evidence downloads by membership.
Record task changes and transitions in an attributable history.
Reassignment requires a valid human member or enabled agent profile and never transfers an active run's credentials.

### 8.5. Example task and acceptance evidence

TASK-1024: Fix login session expiration.

- Description: correct session lifetime and expired-session navigation.
- Requirements: a fixed 24-hour lifetime from issuance and a clear expired-session flow.
- Priority: High. Initial status: BACKLOG. Assignee: unassigned until triage.
- Repository: the project's registered application repository.
- Branch: resolve an authorized execution branch before implementation.

Acceptance criteria:

- AC-1: Session remains valid for 24 hours, unless logout or explicit revocation ends it earlier.
- AC-2: Expired sessions redirect to login when the protected page is next accessed.
- AC-3: Existing tests continue passing.

Verify validity immediately before 24 hours and expiry at the boundary with a controlled clock.
Verify protected API rejection and browser redirection after expiry.
Record the exact existing regression suite and its baseline failures before editing.
Complete the task only after the criteria have passing evidence and the required review.
This is an illustrative application task, not a change to Zetro2's own session policy.

### 8.6. Task, Run, Workflow, Event, Artifact, and Evidence

| Concept  | Question answered                           | Owner                                             |
| -------- | ------------------------------------------- | ------------------------------------------------- |
| Task     | What needs to be accomplished?              | Work management                                   |
| Run      | What did this agent attempt actually do?    | Coding execution                                  |
| Workflow | How should the task progress?               | Task policy and workflow adapter                  |
| Event    | What happened, when, and in which run?      | Producing module; normalized execution stream     |
| Artifact | What was produced?                          | Producing module through scoped storage           |
| Evidence | Why do we believe a criterion is satisfied? | Verification result referenced by work management |

Keep Task and Agent Run separate permanently. A task links runs; it does not embed agent activity.
Task-level Changes, Tests, and Activity views are projections of attributed run or human-work records.
Keep human contributions identifiable with actor, time, revision, and evidence; do not invent agent runs for them.

```text
Project
  ├── Tasks
  │     ├── Dependencies
  │     ├── Context
  │     ├── Runs
  │     │     ├── Model Calls
  │     │     ├── Tool Calls
  │     │     ├── Events
  │     │     ├── Checkpoints
  │     │     └── Artifacts
  │     ├── Changes (attributed references)
  │     ├── Tests (attributed references)
  │     └── Reviews
  └── Milestones
```

Each run records taskId, attempt number, agent profile/version, backend/version,
model identity/configuration, initiator, permission snapshot, start/end times, and outcome.
Also record repository revision, workspace image, context snapshot, tool versions,
input references, budgets, and checkpoint references. Never record secret values.
Store model calls, tool calls, events, checkpoints, and artifacts as separate run-owned records.
Use workspace-scoped foreign keys and public module references to preserve isolation and ownership.

Example history for TASK-1024:

| Attempt | Agent | Model  | Started | Files changed | Tests  | Run status |
| ------- | ----- | ------ | ------- | ------------- | ------ | ---------- |
| Run #1  | Coder | Qwen   | 09:00   | 4             | Failed | Failed     |
| Run #2  | Coder | Claude | 09:20   | 5             | Passed | Completed  |

These are illustrative results. Store full timestamps and exact model identifiers in real records.
Run #2 does not replace Run #1. Its completion can advance task review but cannot bypass DONE gates.
Count files per run and deduplicate paths only in the task summary.
Restarting a failed attempt creates a new run; resuming a supported checkpoint retains its run ID and records a resume event.
Replay displays recorded events. Re-execution creates a new run linked to its predecessor.
Captured inputs support reproducibility and diagnosis, but live model output is not guaranteed to be identical.

### 8.7. Explicit Task Context and Agent Context

Task Context contains Description, Requirements, Acceptance Criteria, Relevant Files,
Related Tasks, Related Issues, Documentation, Previous Runs, and Developer Notes.
Reference the canonical task fields instead of maintaining independent text copies.
Version context edits and resolve external issues only through authorized integrations.

```text
Task Context + Repository Context + Git Context + Runtime Context + Agent Memory
                                  ↓
                            Agent Context
```

Repository Context includes structure, symbols, dependencies, rules, and relevant source.
Git Context includes branch, base revision, current diff, and relevant history.
Runtime Context includes environment, diagnostics, process state, and test results.
Agent Memory contains scoped approved knowledge and labeled generated summaries.

Build a bounded, immutable context snapshot per run and record incremental context additions.
Attach provenance, versions, relevance, and trust level to each contribution.
Filter by current access before retrieval and provider transmission.
Treat previous-run output, issues, and repository content as data, not authority to expand permissions.
Show which sources informed the plan and which were omitted by the context budget.

### 8.8. Executable acceptance criteria

Compile each criterion into a reviewed Verification Plan with named checks,
expected results, required environment, commands, and artifact destinations.
Supported check types include unit tests, integration tests, E2E tests, typecheck, lint, and manual review.
One check can support several criteria; one criterion can require several checks.
Typecheck and lint alone cannot prove a behavioral criterion.
The agent can propose checks but cannot weaken acceptance criteria to make a task pass.

```text
Task → Implementation → Verification → Evidence → Acceptance Criteria → DONE
```

Store verification attempts with criterion version, source revision or content digest,
run or human actor, command, exit status, environment, timestamps, and artifact references.
Use pending, passed, failed, and inconclusive criterion results.
Unsupported automation remains pending manual verification by an authorized reviewer.
An artifact becomes evidence only through its recorded link to a check and criterion.

Checkout example:

| Criterion                        | Required verification                                                   |
| -------------------------------- | ----------------------------------------------------------------------- |
| Checkout accepts a valid card    | Integration success case and sandbox browser checkout                   |
| Invalid card shows an error      | Validation tests and visible E2E error assertion                        |
| Payment failure creates no order | Failure-path integration test asserting persisted order absence         |
| Checkout test suite passes       | Recorded regression command and passing result on the reviewed revision |

Use payment fixtures or provider test mode for this example; do not make live purchases.
Publish criterion results to task detail and require current evidence before DONE.

### 8.9. Typed dependency graph and dispatch

TaskDependency contains taskId, dependsOn, and type: blocks, related, or duplicates.
For a blocks edge, taskId cannot start until dependsOn is DONE.
Related links provide context without restricting scheduling.
Duplicate links identify equivalent work without making one task automatically complete the other.
Require explicit duplicate disposition and preserve both histories.

```text
TASK-101 Database schema → TASK-102 API → TASK-103 Frontend → TASK-104 E2E tests
```

Validate directed blocking edges as an acyclic graph and reject self-dependencies.
Related links may form cycles because they do not schedule work.
Evaluate prerequisites transactionally at dispatch, not only when moving a card to READY.
If a prerequisite reopens, block new dependent runs and pause active dependents at a safe boundary for reassessment.
Record dependency edits, invalidated evidence, and scheduling decisions.

### 8.10. Engineering board, task detail, and human collaboration

Offer a compact Todo/Doing/Done board and an engineering board from the same status field.

| Engineering column | Canonical states                               |
| ------------------ | ---------------------------------------------- |
| BACKLOG            | BACKLOG                                        |
| READY              | READY                                          |
| ACTIVE             | IN PROGRESS, PLANNING, IMPLEMENTING, VERIFYING |
| REVIEW             | REVIEW                                         |
| DONE               | DONE                                           |

Show task key, title, assignee, detailed stage, blockers, and active-run indicator on each card.
Opening a task shows status, assignee, agent state, description, acceptance checklist,
plan progress, selected-run activity, changes, tests, reviews, decisions, and evidence.
Provide a run selector and timestamped activity so old failures remain inspectable.
Continue Agent, Pause, and Review actions depend on permissions and backend capabilities.
Continue resumes a supported paused run or creates a new linked attempt after a terminal run.
Pause does not mark a task complete or discard its evidence.

Separate human work from agent work in the activity and plan views.
Humans define requirements, approve plans, resolve decisions, and review final changes.
The initial agent performs analysis, implementation, tests, debugging, and verification.
Allow Assignee kinds Human and Agent initially, with an accountable human owner for each task.
Add Team assignment later. Do not create separate Coder, Reviewer, Tester, and Research agents yet.
An agent assignment selects a profile; starting a run still requires an authorized human or scoped automation identity.

### 8.11. Approved task.md automation

Developers approve a versioned task selection, phase range, order, permissions, and budgets.
The runner executes eligible tasks, verifies evidence, and updates checkboxes without losing task or run history.
See [automation design](automation.md#approved-taskmd-automation) for dispatch, recovery, approval changes, and progress synchronization.

### 8.12. Backend execution and durable state

An AgentBackend must support capability discovery, start, event streaming, cancel,
approval responses, and a declared resume contract.
Unsupported pause, resume, or tool hooks must be visible as capability limits.
Map backend IDs to Zetro2 run IDs and preserve event provenance.

Zetro2 owns authoritative task state, access decisions, approvals, and the audit trail.
Adapters may retain execution checkpoints referenced by Zetro2.
Use module-owned SQLite persistence initially through repository adapters.
Add checksummed migrations, backup, retention, and restart tests.
Store large artifacts through the scoped storage provider.

Workflow: understand, plan, approve when required, implement, test, bounded repair,
review, then complete. A final model message cannot bypass verification gates.
Enforce execution time, token/cost, iteration, tool-call, and output limits.
Record unknown provider usage explicitly instead of inventing cost precision.

Persist side-effect intent and result with an idempotency key.
After a crash, reconcile uncertain writes before retrying.
Replay reconstructs history without re-executing tools.
Use ordered event sequences and reconnect cursors.
Use a workspace write lease and optimistic file hashes to protect human edits.
A model or backend switch occurs only after the current run stops or checkpoints.

### 8.13. Trigger and control work from mobile or laptop

A shared authenticated API supports preview, approval, start, status, pause, resume, and cancellation.
Work continues server-side after device disconnection with durable status and idempotent requests.
See [remote API control](automation.md#trigger-and-control-work-from-mobile-or-laptop) for endpoints and cross-device safeguards.

## 9. Coding tools and language intelligence

Register typed tools for files, patches, search, symbols, references, commands,
processes, tests, lint, typecheck, Git inspection, and project metadata.
Separate Git commit and push permissions from read-only Git tools.
Reject paths outside the workspace, including symlink and junction escapes.
Keep credentials and ignored secret files out of model context by default.

Use editor language services or LSP for diagnostics, definitions, references, and rename.
Use Tree-sitter for supported-language structure and indexing fallback.
Start with TypeScript/JavaScript, then add Python after its fixture tests pass.
Expose unsupported language operations explicitly.
Include unsaved editor buffers with document versions.
Recheck document versions before applying edits or rename results.

Build context from repository maps, project rules, selected files, symbols,
dependencies, Git changes, diagnostics, tests, and prior tool results.
Budget context and retain source paths and content hashes.
Invalidate stale indexes after edits and branch changes.

## 10. Skills, MCP, browser, and computer tools

Discover repository instructions and versioned `SKILL.md` packages.
Separate organization policy, user instructions, repository guidance, and untrusted content.
Show skill origin and active version. Load only relevant resources.
A skill cannot grant permissions or silently install and execute its scripts.
Persist user-approved repository knowledge separately from generated summaries.

Use an MCP client registry with approved servers, credentials, tool schemas,
timeouts, output limits, health checks, and per-workspace grants.
Route every MCP invocation through the same permission and audit boundary.
Do not enable a newly advertised tool automatically.
Reuse the repository's remote-operations MCP public contract when required.

Use Playwright for application browser actions and for independent Zetro2 E2E tests.
These are separate roles with separate sessions and credentials.
Capture traces, console errors, screenshots, and failed network requests as artifacts.
Restrict agent browser sessions to the assigned workspace and allowed destinations.

Add computer use as an optional isolated desktop service after browser tools pass.
Bind screenshots, keyboard, mouse, clipboard, and file transfer to that sandbox.
Do not attach the agent to the developer's host desktop by default.
Use runtime isolation as well as tool checks because generated shell commands
can attempt network or filesystem access without calling dedicated tools.

## 11. Backend policy conformance

Each backend must prove that Zetro2 can enforce its effective permissions.
Disable built-in shell, write, browser, MCP, and skill execution paths until
their policy behavior has passed tests.
If interception is unavailable, use restrictive mounts, credentials, and network rules.
A backend that cannot enforce an approval-required action must not offer that action.

Keep model credentials in the control service or scoped secret adapter.
Do not mount the Docker socket inside editor, model backend, or browser containers.
A narrow runtime manager owns container creation and destruction.
Limit resources and clean up child processes on timeout, cancellation, and revocation.

## 12. Milestones and execution order

Use task.md displayed order; stable task IDs need not sort numerically.
Each phase exit gate must pass before advancing. A milestone is not full product completion.

| Milestone                    | Required phase order         | Completion proof                                                       |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| M0: authenticated editor     | 0 → 1 → 2 → 3                | Source-built editor and enforced roles                                 |
| M1: daily coding foundation  | 3A → 3B → 4 → 5 → 6 → 6A → 7 | Tasks, direct/OpenCode repair, approved automation, remote control     |
| M2: extensible execution     | 8 → 9 → 10                   | OpenHands, skills, MCP, browser tools                                  |
| M3: reliable daily operation | 11 → 12                      | Reliability, recovery, upgrades, enabled feature E2E                   |
| M4: team automation          | 14 → 13 → 15 → 16            | Organization controls, shared templates, cross-repository work, review |

Phase 0 establishes fixtures before early browser gates.
Phase 3A validates task/run contracts with fixtures; Phase 6 connects live execution.
Phase 6 creates automation persistence; Phase 13 extends it with catalog versions.
Phase 14 precedes sharing so team permissions, policy, and budgets can be enforced.
Phase 11 reliability is mandatory; explicitly deferred computer use stays disabled.
Final completion requires M0–M4 evidence and no unresolved required checks.
Record optional deferrals separately; never mark deferred work as passed.

Run these scenarios through the source-built editor and real API:

- Owner signs in, assigns roles, and opens the intended workspace.
- Viewer can read but cannot save, invoke writes, open a writable terminal, or bypass access through extensions.
- Developer fixes a failing login test, sees a repair cycle, reviews the diff, and completes the task.
- The same conversation changes model and retains context, history, and provider attribution.
- Native, OpenCode, and OpenHands runs each obey permissions and cancellation.
- Role revocation stops an active run and prevents pending approved writes.
- A disconnected browser reconnects without duplicate tool execution.
- A server restart restores task history and reconciles in-flight effects.
- Manual edits survive an agent conflict without silent overwrite.
- An enabled skill, MCP tool, language rename, and browser test produce attributable evidence.
- Two users cannot access each other's files, history, secrets, previews, or browser sessions.
- A Zetro2 source upgrade and rollback preserve workspace data and editor settings.
- A project contains an epic, tasks, subtasks, and a linked milestone with correct progress totals.
- TASK-1024 moves through every detailed state while its board column remains consistent.
- Unmet dependencies, incomplete children, stale reviews, and missing evidence prevent DONE.
- Repeated runs and backend changes preserve task identity, decisions, and acceptance links.
- Reopening a completed task retains history and rechecks affected completion criteria.

Use deterministic backend fixtures for repeatable CI and separate live adapter tests.
A mocked test does not prove a live provider or backend.
Record unavailable credentials as untested coverage, not a successful milestone.
Define startup, interaction, indexing, and resource targets from baseline measurements.

## 13. Evidence, operations, and long-term maintenance

Record command, environment, revision, result, date, and limitation for each completed task.
Store durable summaries in `assist/records/` and generated artifacts in root `dist/`.
Run scoped format, type, lint, boundary, unit, integration, browser, and Docker checks.
Do not treat container health as evidence of a completed coding workflow.

Build the editor from Zetro2 source; record each build revision and adapter compatibility.
Document backup, restore, updates, rollback, credential rotation, and run cleanup.
Keep release and deployment actions separate from this planning revision.
Remote workspaces and coordinated multi-agent execution follow the daily-use reliability milestone.

## 14. Integration references

These sources informed the proposed boundaries. Verify pinned versions during implementation.

- [OpenCode SDK](https://opencode.ai/docs/sdk/) and [providers](https://opencode.ai/docs/providers).
- [OpenHands Software Agent SDK](https://docs.openhands.dev/sdk) and [source](https://github.com/OpenHands/software-agent-sdk).
- [LangGraph JavaScript](https://docs.langchain.com/oss/javascript/langgraph/overview).
- [Copilot Chat source](https://github.com/microsoft/vscode-copilot-chat).
- [Playwright](https://playwright.dev/docs/intro).
- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture).

## 15. Shared automation and team governance

Deliver M4 after the daily-use foundation: workflows across registered repositories and authorized teams,
a shared automation catalog, organization controls, audit coverage, and automated code review.
See [automation and governance design](automation.md) for the complete contracts.

| Requested capability              | Planned behavior                                                                      | Verification gate                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Run across repositories and teams | Workflow graph with one task/run scope per repository and explicit team handoffs      | Two-repository workflow respects grants, dependencies, and partial failure        |
| Standardize successful patterns   | Versioned templates with evaluations, ownership, and measured outcomes                | Candidate passes representative fixtures before promotion                         |
| Share automations                 | Catalog references immutable versions with recipient-owned bindings                   | Two teams reuse one version without copying prompts or credentials                |
| Convert useful tasks              | Extract a reusable draft from selected successful tasks and runs                      | Conversion removes secrets and requires review before publication                 |
| Manage usage and budgets          | Hierarchical limits, concurrent reservations, and measured usage                      | Parallel runs cannot exceed admitted budgets                                      |
| Enforce organization policies     | Centrally constrained grants and mandatory checks                                     | Local configuration cannot weaken organization restrictions                       |
| Audit every action and user       | Correlated append-only records across APIs, tools, runs, workflow, and administration | Audit reconstruction accounts for allowed and denied operations                   |
| Define agent access               | Per-run scope intersected with human authority and organization policy                | Unauthorized repository, tool, model, secret, or network access fails             |
| Automated code review             | Revision-bound static and model-assisted checks with actionable findings              | Seeded bugs and policy violations are found; stale results cannot approve changes |

Add a Zetro2-owned automation module for definitions, catalog versions, executions, and usage accounting.
Reuse public identity and policy capabilities; keep organization/team membership behind the identity adapter.
The coding module continues to own agent attempts and review evidence.
Sharing a definition never grants access to its author's repositories or credentials.
Organization grouping does not claim multi-tenant isolation without separate verification.

Extend Human/Agent assignment with Team assignment in M4, retaining an accountable human.
Extend the initial same-project dependency rule only through authorized workflow edges.
Each constituent task still targets one repository; the parent workflow coordinates outcomes.
Partial failure pauses dependents and records completed work; no automatic cross-repository rollback occurs.
Automated review assists the team and enforces configured gates; it does not guarantee defect-free code.
Publishing templates, posting review comments, merging, and deploying remain separately scoped actions.

## 16. Memory Bank and final review

Daily unattended coding uses a preauthorized Docker profile and remote critical-decision inbox.
See [roaming coding](roaming-coding.md) for default permissions, device access, notifications, and interruption tests.
Phases 5–6 enforce and consume the profile; Phase 6A adds authorized-device control and actionable alerts.
Routine approved tools run without repeated prompts; changed scope and critical effects retain explicit approval.
The server must remain powered and reachable for work to continue while the developer roams.

Add a Zetro2-owned Memory Bank as the structured documentation foundation before live coding.
See [memory-bank.md](memory-bank.md) for document templates, ownership, lifecycle, retrieval, and acceptance checks.
Phase 3B establishes the bank after task records; Phase 5 integrates retrieval and Phase 6 captures approved learning proposals.

Maintain a project brief, product context, system patterns, technical context, active context,
progress projection, decisions, runbooks, and verified lessons with source references and revision history.
The bank stores reviewed knowledge; tasks, permissions, and run evidence retain their existing owners.
Generated notes remain drafts until reviewed or published through an explicitly authorized policy.
Detect stale knowledge, preserve corrections, and enforce project access before retrieval or export.

Final planning review requires complete coverage of every requested capability, explicit dependencies,
phase exit evidence, current document links, unique task IDs, and no claims of implemented behavior.
Basic audit and test fixtures start in Phase 0–1; team-wide governance extends them in Phase 14.
Task-file automation processes only the selected numbered phase checklist, excluding illustrative task templates.
M0–M4 completion includes Memory Bank persistence, retrieval, freshness, isolation, and recovery evidence.
