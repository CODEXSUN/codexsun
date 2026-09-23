# DevCrews Agent Plan

## Identity

Program: DevCrews

First agent: ZXA

Task prefix: `ZXA`

Planned source root: `devkits/devcrews/`

Planning record root: `devkits/agent/`

## Product Decision

Zuno is the control plane. It owns projects, assignments, approvals, agent
profiles, model profiles, budgets, audit records, and worker selection.

CXForge is an isolated execution worker. It owns a task workspace, tools,
verification, previews, and execution evidence.

DevCrews contains agent runtimes. An agent receives a short-lived assignment
from Zuno. It uses only the capabilities in that assignment. It can work with
one or more assigned CXForge workers in parallel.

ZXA is the first DevCrews runtime. It is a Docker container that runs a coding
agent adapter. It is not an orchestrator, a project database, a Git authority,
or a Docker controller.

```text
Zuno
  -> signed assignment and capability lease
ZXA agent container
  -> task-scoped CXForge control requests
CXForge assignment workspace
  -> repository, tools, tests, preview, evidence
Zuno
  -> review, pull request, merge confirmation, audit record
```

## Non-Negotiable Boundaries

- Zuno creates assignments and chooses the agent, model profile, CXForge worker,
  repository, owned paths, budget, and required checks.
- ZXA cannot create a project, select another repository, change owned paths,
  grant itself more tools, choose a different model, approve work, create a pull
  request, or merge changes.
- CXForge accepts execution only for a Zuno assignment. It rejects an expired,
  revoked, mismatched, or replayed lease.
- ZXA does not receive a Docker socket, a Git provider token, a database master
  password, or a provider API key.
- A model provider key stays in the ZXA container or a later private model
  gateway. It never passes through Zuno browser APIs or CXForge task records.
- Each assignment uses one isolated CXForge workspace. Parallel work uses
  separate workspaces and branches.
- Zuno records each state change. CXForge and ZXA report evidence. Neither can
  change approval state directly.

## Terms

| Term | Meaning |
| --- | --- |
| Agent profile | A Zuno record that defines an agent image, capabilities, and allowed model profiles. |
| Assignment | A Zuno-approved unit of work with a repository, base commit, owned paths, and limits. |
| Capability lease | A short-lived signed token for one assignment and one action set. |
| Crew | A named agent variant under `devkits/devcrews/`. |
| Evidence | Diff, test output, preview result, logs, usage, and declared limitations. |
| Model profile | A Zuno-controlled model, reasoning level, turn limit, token limit, and cost limit. |
| ZXA | The first coding-agent crew. It plans and issues allowed CXForge work for assigned tasks. |

## ZXA v1 Contract

ZXA receives this immutable assignment input from Zuno:

```text
assignment ID and revision
project and repository ID
base commit and branch name
task prompt and acceptance criteria
owned paths
CXForge endpoint identity
capability lease
agent profile and model profile IDs
maximum turns, time, tokens, and cost
required verification and preview policy
correlation ID
```

ZXA can request only these actions from CXForge:

1. Read approved workspace state and task events.
2. Ask CXForge to run the selected coding adapter.
3. Submit a bounded follow-up after failed verification.
4. Request approved verification and preview actions.
5. Return a final evidence summary to Zuno.

ZXA must use structured messages. It must not send arbitrary shell commands.
CXForge validates all writes and commands against the assignment policy.

## Parallel Execution Design

One ZXA container can supervise several assignments. It must not share task
memory, credentials, files, model conversations, or cancellation state between
assignments.

```text
ZXA runtime
  +-- run A -> lease A -> CXForge workspace A -> branch A
  +-- run B -> lease B -> CXForge workspace B -> branch B
  +-- run C -> lease C -> CXForge workspace C -> branch C
```

Zuno owns scheduling. ZXA reports capacity and accepts a bounded number of
runs. Start with one active run per ZXA container. Add parallel runs only after
the run ledger, cancellation, quotas, and isolation checks pass.

Zuno must reserve owned paths before it starts a run. Overlapping assignments
must queue, block, or require an explicit shared-work decision.

## DevCrews Layout

```text
devkits/devcrews/
  base/
    container contract, runner protocol, health contract, test fixtures
  zxa/
    Docker image, Zuno client, CXForge client, coding-loop adapter, tests
  variants/
    later read-only review and release agents
```

The base layer contains no model vendor key and no project-specific command.
Each crew declares its image, protocol version, capabilities, and supported
model profiles. Zuno registers crews through an agent profile. CXForge never
imports a DevCrews package.

## Security Model

ZXA uses two separate credentials:

1. A bootstrap credential lets it register with Zuno at startup.
2. A short-lived capability lease permits one assignment.

Zuno rotates or revokes the bootstrap credential. Zuno can revoke an active
lease. CXForge validates lease audience, assignment ID, workspace ID, expiry,
revision, allowed actions, and correlation ID.

Use mTLS or private-network service identity for production traffic. Use a
different secret for every service boundary. Do not use one shared client key
for Zuno, ZXA, and CXForge.

ZXA writes only structured run events to Zuno. Redact provider errors and tool
output before persistence. Store model prompts, model output, and snapshots
only when the project retention policy allows them.

## Delivery Phases

### Phase ZXA-100: Contracts and Trust

Goal: Define a safe Zuno to agent to CXForge protocol before creating a model
container.

- `ZXA-101` Define agent profiles, model profiles, assignments, runs, leases,
  evidence, and audit events.
- `ZXA-102` Define signed capability leases and revocation rules.
- `ZXA-103` Define the versioned ZXA runner protocol and error contract.
- `ZXA-104` Add a Zuno assignment state machine and durable outbox events.

Exit: Zuno can create one approved assignment with no agent execution.

### Phase ZXA-110: DevCrews Base and ZXA Runtime

Goal: Run one registered ZXA container without repository or Docker authority.

- `ZXA-111` Create the DevCrews base image and runner health protocol.
- `ZXA-112` Create the ZXA image, registration client, and lease verifier.
- `ZXA-113` Add Zuno agent registration, health, disable, and drain controls.
- `ZXA-114` Add Zuno-to-ZXA run dispatch and durable run recovery.

Exit: Zuno can dispatch and cancel a no-op ZXA run with an audit trail.

### Phase ZXA-120: One Isolated Coding Run

Goal: Let ZXA operate one assignment workspace through CXForge.

- `ZXA-121` Add assignment workspace creation with a pinned base commit and
  task branch.
- `ZXA-122` Add task-scoped ZXA-to-CXForge actions and lease validation.
- `ZXA-123` Add one model adapter with structured output and bounded retries.
- `ZXA-124` Collect diff, tests, preview, usage, and failure evidence.

Exit: A human-approved assignment reaches Zuno review with one isolated branch.

### Phase ZXA-130: Parallel Crews and Conflict Control

Goal: Run independent assignments in parallel without shared mutable state.

- `ZXA-131` Add owned-path leases and conflict decisions in Zuno.
- `ZXA-132` Add worker capacity, run quotas, and fair scheduling.
- `ZXA-133` Add per-run cancellation, timeout, retry, and orphan recovery.
- `ZXA-134` Add two-worker live tests against the same repository.

Exit: Two ZXA runs can change disjoint paths in separate CXForge workspaces.

### Phase ZXA-140: Review and Change Delivery

Goal: Make agent work reviewable and safe to deliver.

- `ZXA-141` Build the Zuno evidence and review workspace.
- `ZXA-142` Add reviewer decisions and changes-requested follow-ups.
- `ZXA-143` Add branch publication and pull-request preparation.
- `ZXA-144` Add explicit human merge confirmation and retained audit evidence.

Exit: A team can review a ZXA change and create a pull request without direct
worker access.

### Phase ZXA-150: Production Operation

Goal: Operate many agents and workers on a protected server.

- `ZXA-151` Add PostgreSQL persistence and migration rules for Zuno control data.
- `ZXA-152` Add a private preview gateway and project access checks.
- `ZXA-153` Add metrics, cost alerts, usage quotas, and incident records.
- `ZXA-154` Add workspace retention, artifact retention, and secure cleanup.

Exit: A team can operate ZXA and CXForge with defined recovery and retention.

## Deferred Work

- Zetro integration.
- Autonomous approval or merge.
- A public agent marketplace.
- Multi-repository assignments.
- Shared mutable workspaces.
- A general model gateway before one direct model adapter proves the run contract.
- Additional crew variants before ZXA passes Phase ZXA-130.

## First Proof

The first proof uses one repository, two human users, one ZXA container, and
two CXForge assignment workspaces. Each assignment has disjoint owned paths.
Both runs must create separate branches, tests, evidence, and previews. A human
must approve each pull request. No agent can access the other assignment.
