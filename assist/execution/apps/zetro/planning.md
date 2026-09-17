# Zetro Agentic IDE Planning

## Identity

Application: Zetro

Task prefix: `Z`

## Goal

Build Zetro as a governed agentic IDE. It turns an approved task into a bounded, reviewable worktree attempt.

Zetro plans, creates tasks, selects an approved worker, verifies evidence, and prepares human-controlled merge or deployment decisions.

## Core Rules

- Zetro owns workflow state. A model provider does not own workflow state.
- Model output is untrusted until a named policy or human approves it.
- One worker attempt has one short task ID, worktree, base revision, and guidance snapshot.
- A worker cannot merge, push, release, deploy, alter secrets, or expand scope.
- Every state transition writes an audit record and correlation ID.

## Architecture

```text
Zetro web -> public contracts -> Zetro modules -> provider adapters
                                            -> agent runtime
                                            -> worktree adapter
                                            -> evidence adapters
```

Zetro uses Framework and Platform Core public contracts. Its modules own routes, services, repositories, migrations, seeders, tests, and README files.

## Runtime Direction

Use an adapter contract for model and agent runtimes. Evaluate OpenAI Agents SDK first for controlled coding-agent execution. Evaluate LangGraph only for durable workflow pauses and resumptions. Keep n8n outside the core state machine for optional notifications or external automation. Evaluate Hermes and OpenClaw through disposable, capability-limited adapters only.

## Phases

### Phase Z-1200: Governance Foundation

- [x] Z-1201 Host and provider foundation.
- [x] Z-1202 SQLite readiness and recovery policy.
- [ ] Z-1203 Provider-neutral agent runtime contract and secret boundary.
- [ ] Z-1204 Capability policy for Git, files, commands, network, and Docker Sandbox.

Exit: Zetro can reject an unsafe action before a worker starts.

### Phase Z-1210: Planning And Task Control

- [ ] Z-1211 Idea, plan, task, phase, and approval records.
- [ ] Z-1212 Plan review, fingerprint, stale-plan, and change-request policy.
- [ ] Z-1213 Single-scope child task splitting and dependency ordering.

Exit: only an approved short task ID can request a worktree.

### Phase Z-1220: Guidance And Context

- [ ] Z-1221 Development-record path and source ownership capture.
- [ ] Z-1222 Immutable guidance snapshot with hashes and base revision.
- [ ] Z-1223 Skills selection, token budget, context limits, and redaction policy.

Exit: an agent receives current, bounded, reviewable guidance.

### Phase Z-1230: Agent Execution Loop

- [ ] Z-1231 Agent runtime adapter and run lifecycle.
- [ ] Z-1232 Plan, act, observe, verify, retry, stop, and resume loop.
- [ ] Z-1233 Tool allowlist, approval interrupts, timeout, and budget limits.

Exit: a worker attempt stops safely and records every tool action.

### Phase Z-1240: Worktree And Evidence

- [ ] Z-1241 Worktree create, verify, develop, review, approval, and merge adapters.
- [ ] Z-1242 Diff scope review and shared-package escalation.
- [ ] Z-1243 Test, browser, database, Docker, and deployment evidence records.

Exit: Zetro can prove what changed and what was tested.

### Phase Z-1250: IDE Experience

- [ ] Z-1251 Task board, phase status, attempt timeline, and audit views.
- [ ] Z-1252 Plan editor, review queue, approval controls, and evidence browser.
- [ ] Z-1253 Agent console with streaming, pause, resume, and stop controls.

Exit: an operator can understand one task without reading logs manually.

### Phase Z-1260: Reliability And Integration

- [ ] Z-1261 SQLite retention, backup, restore, idempotency, and recovery tests.
- [ ] Z-1262 OpenAI adapter evaluation and fallback contract tests.
- [ ] Z-1263 LangGraph, n8n, Hermes, and OpenClaw adapter evaluations.
- [ ] Z-1264 Docker Sandbox and local worktree integration rehearsal.

Exit: selected integrations have explicit value, limits, and rollback paths.
