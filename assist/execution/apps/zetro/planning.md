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
`@codexsun/ui` exports and the shared `MainWorkspace` template. Application code may
compose those exports, but it must not duplicate UI controls, tokens, templates,
or blocks.

## Delivered Foundation

```text
Zetro web chat -> Zetro public contracts -> Zetro chat provider
                                            -> private SQLite history
                                            -> private scoped attachment storage
                                            -> local Codex CLI adapter
                                            -> source-linked final brief
                                            -> prepared agent task
                                            -> durable Zuno receipt
```

- The web workspace owns draft interaction and conversation selection only.
- The `zetro.chat` API provider owns conversation and message persistence in
  Zetro's private SQLite database.
- The local runner invokes `codex exec` in read-only, ephemeral mode. It uses
  the existing local Codex CLI session. It does not read or persist tokens or
  authentication files.
- Device codes are transient local-runtime data. Zetro may show an active code
  only to the current browser user. It does not store the code in SQLite,
  storage, logs, or chat history.
- The brief provider owns source-linked final briefs. The task provider creates
  prepared task records from final briefs only. The task provider can send an
  immutable package to Zuno and store its receipt. Neither provider can create
  repository work, a worktree, or a worker dispatch.

## Phases

### Phase Z-1200: Chat-First Foundation

- [x] Z-1203 Persistent chat idea workspace and local-Codex execution boundary.
- [x] Z-1204 Local Codex connection status, device-code boundary, and secret
      redaction policy.
- [x] Z-1205 Idea, revision, final-brief, and task-handover records.
- [x] Z-1206 Final-brief readiness and idempotent Zuno delivery receipts.

Exit: a person can create and finalize an idea without the chat being able to
execute delivery work.

## Final Brief and Task Handover Decision

Every conversation has an idea stage: Explore, Compare, Revise, or Final. A
final brief records its selected response UUIDs, outcome, audience, scope,
exclusions, constraints, risks, and success signals.

A final brief must select at least one source response. It can refer to one
project or use the common all-projects scope. A prepared agent task can only
use a final brief and must retain the same project scope and reference.

Prepared tasks do not execute work. Human review and the later task-control
phase remain required before any agent execution.

### Phase Z-1210: Handoff Reliability

- [ ] Z-1211 Read-only project catalog selection.
- [ ] Z-1212 Immutable final-brief revisions.
- [ ] Z-1213 Delivery history and Zuno receipt inspection.

Exit: Zetro can prove which final brief and prepared task Zuno accepted.

## Ownership After Handoff

Zuno owns repository validation, task approval, dispatch, review, and merge
coordination. CXForge owns worktrees, isolated execution, checks, evidence, and
preview output. These controls must not be added to Zetro.

## Local Codex Authentication Decision

Z-1203 calls an already-authenticated local Codex CLI only. Device-code
authentication is a local-runtime concern. Z-1204 can return a one-time code
and verification URL to the current browser user. It must not copy `auth.json`,
tokens, or device codes into Zetro storage, logs, or chat records.

## First Task Acceptance

Z-1203 is complete when the web host provides keyboard-accessible chat, a
history side menu, and private conversation persistence; it sends replies to an
already-authenticated local Codex CLI in read-only, ephemeral mode. No worker,
repository command, credential, final brief, or task handover record is created.
