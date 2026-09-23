# DevCrews Task Register

Task prefix: `ZXA`

Read `plan.md` before changing code.

Zetro is out of scope for this task register. Zuno controls every assignment.
CXForge executes assignment-scoped work. ZXA is the first DevCrews runtime.

## Approval Rules

1. Add task detail to `plan.md` before implementation.
2. Mark a task `approved` before creating a worktree or container image.
3. Record the owner module, data impact, and security impact before changes.
4. Use a separate assignment workspace for every live coding run.
5. Do not give ZXA a Docker socket or an unrestricted Git credential.
6. Mark a task complete only after its stated checks pass.
7. A human must approve pull-request creation and merge.

## Phase ZXA-100: Contracts and Trust

- [ ] ZXA-101: Define Zuno agent control contracts
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents`
  - Data impact: yes
  - Scope: agent profiles, model profiles, assignments, runs, evidence, and audit events.
  - Exclusions: agent container implementation and model provider integration.
  - Verification: contract tests, migration test, authorization tests, and API reference check.

- [ ] ZXA-102: Define capability leases and revocation
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents` and `devkits/cxforge/internal/server`
  - Data impact: yes
  - Scope: signed assignment leases, expiry, audience, action claims, revision checks, and revocation.
  - Exclusions: long-lived shared service keys for run actions.
  - Verification: valid, expired, revoked, replayed, and mismatched lease tests.

- [ ] ZXA-103: Define the DevCrews runner protocol
  - Status: planned
  - Owner: `devkits/devcrews/base`
  - Data impact: no
  - Scope: registration, health, drain, run start, cancel, event, and result schemas.
  - Exclusions: ZXA coding behavior.
  - Verification: protocol fixture tests in TypeScript and container contract tests.

- [ ] ZXA-104: Add durable Zuno assignment transitions
  - Status: planned
  - Owner: `devkits/zuno/api/modules/assignments`
  - Data impact: yes
  - Scope: optimistic versions, audit events, outbox messages, and approval gates.
  - Exclusions: pull-request creation.
  - Verification: transition, concurrent update, idempotency, and outbox recovery tests.

## Phase ZXA-110: DevCrews Base and ZXA Runtime

- [ ] ZXA-111: Create the DevCrews base container contract
  - Status: planned
  - Owner: `devkits/devcrews/base`
  - Data impact: no
  - Scope: non-root image, health endpoint, structured logging, configuration loading, and no Docker socket.
  - Exclusions: coding model and repository access.
  - Verification: image scan, non-root test, health test, and no-socket mount test.

- [ ] ZXA-112: Create the ZXA agent container
  - Status: planned
  - Owner: `devkits/devcrews/zxa`
  - Data impact: no
  - Scope: Zuno registration, lease acceptance, run isolation, cancellation, and structured result output.
  - Exclusions: direct repository mounts and direct Git provider access.
  - Verification: registration, expired lease, cancellation, and event ordering tests.

- [ ] ZXA-113: Add Zuno agent registry controls
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents` and `devkits/zuno/web`
  - Data impact: yes
  - Scope: agent status, capabilities, capacity, disable, drain, and last health state.
  - Exclusions: automatic agent replacement.
  - Verification: API authorization tests and browser-visible operator controls.

- [ ] ZXA-114: Dispatch and recover a no-op run
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents` and `devkits/devcrews/zxa`
  - Data impact: yes
  - Scope: durable dispatch, idempotency, timeout, cancellation, and restart recovery.
  - Exclusions: CXForge execution.
  - Verification: Zuno restart during dispatch and agent restart during run tests.

## Phase ZXA-120: One Isolated Coding Run

- [ ] ZXA-121: Create one assignment workspace per run
  - Status: planned
  - Owner: `devkits/zuno/api/modules/assignments` and `devkits/cxforge/internal/server`
  - Data impact: yes
  - Scope: pinned commit, task branch, workspace ID, workspace lease, and cleanup state.
  - Exclusions: shared mutable checkouts.
  - Verification: two workspaces from one repository have independent files and branches.

- [ ] ZXA-122: Add task-scoped ZXA-to-CXForge actions
  - Status: planned
  - Owner: `devkits/cxforge/internal/server` and `devkits/devcrews/zxa`
  - Data impact: yes
  - Scope: read state, run coding adapter, verify, preview, follow-up, and evidence return.
  - Exclusions: arbitrary shell command forwarding.
  - Verification: action allowlist, path rejection, lease validation, and event correlation tests.

- [ ] ZXA-123: Add one approved coding model adapter
  - Status: planned
  - Owner: `devkits/devcrews/zxa`
  - Data impact: yes
  - Scope: model profile selection, structured output, turn limit, token limit, cost limit, and redaction.
  - Exclusions: model marketplace and automatic fallback.
  - Verification: mocked provider, malformed response, budget stop, and secret-redaction tests.

- [ ] ZXA-124: Return complete run evidence to Zuno
  - Status: planned
  - Owner: `devkits/zuno/api/modules/assignments`, `devkits/devcrews/zxa`, and `devkits/cxforge/internal/server`
  - Data impact: yes
  - Scope: diff, tests, preview, usage, result summary, and limitations.
  - Exclusions: approval decisions by the agent.
  - Verification: end-to-end run reaches `awaiting-review` with complete evidence.

## Phase ZXA-130: Parallel Crews and Conflict Control

- [ ] ZXA-131: Add owned-path leases
  - Status: planned
  - Owner: `devkits/zuno/api/modules/assignments`
  - Data impact: yes
  - Scope: prefix claims, conflict state, expiry, release, and explicit shared-work override.
  - Exclusions: semantic merge prediction.
  - Verification: overlapping paths block and disjoint paths proceed.

- [ ] ZXA-132: Add capacity scheduling
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents`
  - Data impact: yes
  - Scope: agent capacity, CXForge capacity, queue ordering, per-project limits, and fair dispatch.
  - Exclusions: uncontrolled fan-out.
  - Verification: queue fairness, capacity limit, and drain behavior tests.

- [ ] ZXA-133: Add parallel run recovery
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents` and `devkits/devcrews/zxa`
  - Data impact: yes
  - Scope: run heartbeat, orphan detection, cancellation, retry policy, and workspace lease recovery.
  - Exclusions: unsafe automatic rerun after uncertain writes.
  - Verification: simulated Zuno, ZXA, and CXForge failures at each run stage.

- [ ] ZXA-134: Prove two parallel assignments
  - Status: planned
  - Owner: `devkits/zuno/api` integration tests
  - Data impact: no
  - Scope: two ZXA runs, two CXForge workspaces, one repository, and disjoint owned paths.
  - Exclusions: same-path collaboration.
  - Verification: live Docker test confirms isolated branches, previews, evidence, and cancellation.

## Phase ZXA-140: Review and Change Delivery

- [ ] ZXA-141: Build the Zuno evidence review view
  - Status: planned
  - Owner: `devkits/zuno/web` and `devkits/zuno/api/modules/review`
  - Data impact: yes
  - Scope: diff, logs, tests, preview, usage, reviewer comments, and decision history.
  - Exclusions: direct worker shell access from the browser.
  - Verification: accessible browser flow and API authorization tests.

- [ ] ZXA-142: Add reviewer feedback runs
  - Status: planned
  - Owner: `devkits/zuno/api/modules/review` and `devkits/devcrews/zxa`
  - Data impact: yes
  - Scope: changes-requested decision, bounded follow-up, new run revision, and invalidated evidence.
  - Exclusions: reviewer-controlled arbitrary commands.
  - Verification: rejected evidence creates a new review-required run revision.

- [ ] ZXA-143: Prepare pull requests
  - Status: planned
  - Owner: `devkits/zuno/api/modules/review` and `devkits/cxforge/internal/server`
  - Data impact: yes
  - Scope: approved branch publication, pull-request draft, and external ID record.
  - Exclusions: automatic merge.
  - Verification: mock Git provider test and protected live Git fixture test.

- [ ] ZXA-144: Require merge confirmation
  - Status: planned
  - Owner: `devkits/zuno/api/modules/review` and `devkits/zuno/web`
  - Data impact: yes
  - Scope: authorized human merge confirmation and immutable audit event.
  - Exclusions: agent merge authority.
  - Verification: role, confirmation, and duplicate merge request tests.

## Phase ZXA-150: Production Operation

- [ ] ZXA-151: Move Zuno control data to PostgreSQL
  - Status: planned
  - Owner: `devkits/zuno/api`
  - Data impact: yes
  - Scope: migrations, transaction boundaries, outbox, and concurrent state checks.
  - Exclusions: Redis as a source of truth.
  - Verification: migration, concurrent transition, and recovery tests.

- [ ] ZXA-152: Add a protected preview gateway
  - Status: planned
  - Owner: `devkits/zuno/api/modules/previews`
  - Data impact: yes
  - Scope: TLS routing, project authorization, assignment expiry, and preview revocation.
  - Exclusions: public raw Docker ports.
  - Verification: authenticated preview access and revoked assignment tests.

- [ ] ZXA-153: Add operations and cost controls
  - Status: planned
  - Owner: `devkits/zuno/api/modules/agents`
  - Data impact: yes
  - Scope: run metrics, cost alerts, project budgets, agent health alerts, and incident records.
  - Exclusions: automated cost overrides.
  - Verification: threshold, alert, and quota enforcement tests.

- [ ] ZXA-154: Add retention and cleanup policy
  - Status: planned
  - Owner: `devkits/zuno/api/modules/assignments` and `devkits/cxforge/internal/server`
  - Data impact: yes
  - Scope: workspace, preview, artifact, and log retention with secure cleanup.
  - Exclusions: deletion of an active or review-pending workspace.
  - Verification: expiry, legal hold, active lease, and cleanup audit tests.

## First Approved Build Set

Do not start ZXA coding behavior until these tasks have explicit approval:

- `ZXA-101`
- `ZXA-102`
- `ZXA-103`
- `ZXA-104`
- `ZXA-111`
- `ZXA-112`
- `ZXA-113`
- `ZXA-114`
