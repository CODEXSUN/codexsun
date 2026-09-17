# Zetro Chat-First Delivery Plan

## Identity

Application: Zetro

Task prefix: `Z`

## Product Direction

Zetro starts as a governed idea conversation. A person uses chat to explore an
idea, revise it, settle a final brief, and hand that brief to the later task
workflow. Chat is a planning surface; it cannot start repository work, create a
worktree, or grant approval.

The first screen is a standalone Zetro web workspace. It uses only published
`@codexsun/ui` exports and the shared `MdiMain` template. Application code may
compose those exports, but it must not duplicate UI controls, tokens, templates,
or blocks.

## Delivery Boundaries

```text
Zetro web chat -> Zetro public contracts -> Zetro workflow modules
                                            -> local Codex adapter
                                            -> evidence and approval records
```

- The chat UI owns only in-memory draft interaction in its first task.
- A future Zetro module owns persisted ideas, revisions, final briefs, and task
  handover records.
- A future local-Codex adapter owns device-code initiation, polling, local
  credential-store access, and redacted connection status.
- The web host never reads, writes, displays, or persists Codex credentials,
  device codes, or local authentication files.

## Phases

### Phase Z-1200: Chat-First Foundation

- [ ] Z-1203 Chat idea workspace and connection-settings shell.
- [ ] Z-1204 Local Codex connection contract, device-code boundary, and secret
      redaction policy.
- [ ] Z-1205 Idea, revision, final-brief, and task-handover records.

Exit: a person can create and finalize an idea without the chat being able to
execute delivery work.

### Phase Z-1210: Governed Task Control

- [ ] Z-1211 Plan, task, phase, approval, and audit records.
- [ ] Z-1212 Review fingerprints, stale-plan detection, and change requests.
- [ ] Z-1213 Single-scope task splitting and dependency ordering.

Exit: only a reviewed, approved short task ID can request a worker attempt.

### Phase Z-1220: Controlled Execution

- [ ] Z-1221 Immutable guidance snapshots with hashes and base revision.
- [ ] Z-1222 Agent runtime adapter, capability policy, and action audit trail.
- [ ] Z-1223 Worktree, evidence, review, deployment rehearsal, and manual merge
      adapters.

Exit: Zetro can prove an approved worker's bounded change and its verification.

## Local Codex Authentication Decision

The Z-1203 settings surface is deliberately non-authenticating. Device-code
authentication is a local-runtime concern, not browser state. Z-1204 must use a
provider-neutral adapter, expose only redacted status to the browser, and require
an operator to complete the browser/device-code step. It must not copy
`auth.json`, tokens, or device codes into Zetro storage, logs, API responses, or
chat records.

## First Task Acceptance

Z-1203 is complete when the web host provides a keyboard-accessible conversation
for drafting, revising, finalizing, and preparing an idea handover, plus a clear
local-Codex connection-settings shell. All interaction remains local and visibly
marked as a draft; no worker, repository command, credential, or persistent
workflow record is created.
