# ZCode Implementation Task Register

## Progress rules

Architecture: [planning.md](planning.md). Original brief: [readme.md](readme.md).
Status: planning refined on 2026-09-24. Implementation has not been verified.
Next implementation task: 0.1. Identity enforcement precedes autonomous writes.

Use stable phase.task identifiers. Check an item only when its evidence passes.
For each completed item, add an evidence link with revision, command, result,
environment, date, and limitations. Mark blocked work with its concrete dependency.
A phase completes only after its exit check. Do not check mocked coverage as live coverage.

This checklist tracks platform implementation. The Task entity below is the product's
daily work record. Checklist IDs such as 3A.1 are not product task keys such as TASK-1024.
Task IDs remain stable. Execute displayed source order, not numeric ID order.
Phase order: 0 → 1 → 2 → 3 → 3A → 3B → 4 → 5 → 6 → 6A → 7 → 8 → 9 → 10 → 11 → 12 → 14 → 13 → 15 → 16.
Phase 14 precedes Phase 13 because team access and budgets must exist before sharing.
Complete each phase exit check before advancing. Early fixtures do not prove live backend behavior.

## Phase 0 — Baseline and integration decisions

Dependencies: none. Deliverable: implementation-ready source and contract inventory.

- [ ] 0.1 Verify the root, inspect current changes, and inventory applicable owner rules.
- [ ] 0.2 Inventory `apps/temp/openvscode-server`, upstream revision, modifications, licenses, and source size.
- [ ] 0.3 Inspect native chat, inline chat, language-model services, extension APIs, and tool confirmations.
- [ ] 0.4 Compare Copilot Chat source requirements with the local editor version and available service contracts.
- [ ] 0.5 Inventory ZCode startup, Codexsun OS, previews, ports, volumes, and existing shared identity APIs.
- [ ] 0.6 Record the four custom layers, module ownership, public interfaces, and compatibility matrix.
- [ ] 0.7 Document the vendor-source exception and upstream dependency/build strategy against Assist rules.
- [ ] 0.8 Define role capabilities, workspace isolation, direct edit behavior, and backend permission requirements.
- [ ] 0.9 Pin candidate OpenCode, OpenHands, LangGraph, LangChain, MCP, and Playwright versions.
- [ ] 0.9a Establish API, identity, backend, clock, and Playwright fixtures with root artifact paths for early verification.
- [ ] 0.10 Exit: record a reviewed implementation baseline with unresolved compatibility limits.

## Phase 1 — Identity, membership, and authorization

Dependencies: Phase 0. Deliverable: server-enforced access foundation.

- [ ] 1.1 Compose public identity, session, secrets, and storage providers without private cross-app imports.
- [ ] 1.2 Define workspace membership and Owner, Maintainer, Developer, Reviewer, and Viewer presets.
- [ ] 1.3 Define scoped read, write, execute, agent, approval, Git, provider, MCP, browser, and computer grants.
- [ ] 1.4 Add module-owned persistence, Zod contracts, checksummed migrations, and repeat-safe seeds.
- [ ] 1.5 Implement login, logout, session expiration, workspace selection, and membership management.
- [ ] 1.6 Authorize every API resource and event subscription using server-resolved membership.
- [ ] 1.7 Implement private upstream routing and authenticated editor and preview entry points.
- [ ] 1.8 Bind approvals to an exact action, actor, workspace, content digest, and expiration.
- [ ] 1.9 Revoke sessions/subscriptions and define run-cancellation hooks; verify hooks with fixtures until live integration in Phase 6.
- [ ] 1.10 Test denied access, ID substitution, session expiry, role changes, and cross-user reads.
- [ ] 1.10a Establish baseline append-only access/action audit and redaction; Phase 14 extends organization reporting and integrity checks.
- [ ] 1.11 Exit: API and gateway tests prove the role matrix and no unauthenticated upstream bypass.

## Phase 2 — Copy OpenVSCode and establish a reproducible build

Dependencies: Phase 0. May overlap Phase 1 without exposing an unauthenticated service.

- [ ] 2.1 Confirm the destination `devkits/zcode/openvscode` and preserve any existing destination files.
- [ ] 2.2 Copy the source inventory from `apps/temp/openvscode-server` without changing the original clone.
- [ ] 2.3 Exclude Git metadata, dependencies, caches, generated output, secrets, and runtime data.
- [ ] 2.4 Retain licenses and notices; record upstream revision, content checksums, and local modifications.
- [ ] 2.5 Add a documented container build with pinned dependencies and root artifact destinations.
- [ ] 2.6 Add the ordered ZCode patch manifest and source-update procedure.
- [ ] 2.7 Apply product branding, default settings, and extension configuration through the custom layers.
- [ ] 2.8 Build the imported source and identify the actual editor version in the resulting artifact.
- [ ] 2.9 Verify explorer, save, terminal, search, Git diff, language extensions, Codexsun OS, and Zbrowser parity.
- [ ] 2.10 Exit: source-built editor passes parity checks and the prior image remains available for rollback.

## Phase 3 — Enforce permissions in the real editor

Dependencies: Phases 1–2. Deliverable: M0 authenticated editor.

- [ ] 3.1 Bind each editor connection to a server-authorized workspace and identity.
- [ ] 3.2 Enforce readonly mounts for Reviewer and Viewer sessions.
- [ ] 3.3 Disable writable terminal and extension execution for readonly sessions at the server boundary.
- [ ] 3.4 Isolate developer workspace volumes, runtime credentials, settings, and extension hosts.
- [ ] 3.5 Protect file downloads, direct saves, previews, extension installation, and terminal reconnects.
- [ ] 3.6 Close editor access and terminate scoped processes after session or membership revocation.
- [ ] 3.7 Test direct protocol calls and extension-based write attempts beyond hidden UI controls.
- [ ] 3.8 Exit: browser-visible Owner, Developer, Reviewer, and Viewer flows pass against real filesystem permissions.

## Phase 3A — Projects, task records, and delivery lifecycle

Dependencies: Phase 3. Deliverable: task management before write-capable chat execution.
This phase belongs to M1 and precedes Phases 4–7.

- [ ] 3A.1 Add the work-management module with public contracts, provider, owned persistence, migrations, and tests.
- [ ] 3A.2 Define Workspace → Project → Epic → Task → Subtask/Agent Run and project milestone links.
- [ ] 3A.3 Support tasks without epics and distinguish logical workspaces from runtime checkout instances.
- [ ] 3A.4 Define every Task field listed in planning section 8.2, with schemas and versioned updates.
- [ ] 3A.5 Allocate immutable internal IDs and project-unique display keys safely under concurrent creation.
- [ ] 3A.22a Model Agent Run as a separate entity with immutable task linkage and ordered attempt numbers.
- [ ] 3A.22b Define run-owned persistence for calls, events, checkpoints, and artifacts; use fixtures until live integration in Phase 6.
- [ ] 3A.22c Add typed Human/Agent assignment and accountable human ownership; reserve Team and specialist agents for later.
- [ ] 3A.22d Add versioned Task Context containing every source listed in planning section 8.7.
- [ ] 3A.22e Implement blocks, related, and duplicates links with distinct dispatch and disposition rules.
- [ ] 3A.19 Add task capabilities, audit history, optimistic updates, evidence access checks, and reassignment rules.
- [ ] 3A.6 Implement project, epic, milestone, task, and subtask APIs with workspace authorization.
- [ ] 3A.7 Add assignee validation, priority, repository binding, branch references, and immutable run revisions.
- [ ] 3A.8 Add requirement and acceptance-criterion IDs with versioning and evidence links.
- [ ] 3A.9 Reject parent cycles, blocking-dependency cycles, and unsupported cross-project relationships; allow nonblocking related cycles.
- [ ] 3A.10 Compute blockers, child progress, epic progress, and milestone progress without duplicate counting.
- [ ] 3A.11 Implement BACKLOG → READY → IN PROGRESS → PLANNING → IMPLEMENTING → VERIFYING → REVIEW → DONE.
- [ ] 3A.12 Derive Todo/Doing/Done from detailed status and validate board drag transitions server-side.
- [ ] 3A.13 Guard READY and dispatch using assignee, scope, criteria, prerequisites, repository, and current permissions.
- [ ] 3A.14 Implement verification-failure and review-change loops, reopen, blocked reasons, and archive behavior.
- [ ] 3A.15 Gate DONE on required criteria, current evidence, review policy, prerequisites, and child completion.
- [ ] 3A.16 Invalidate affected completion attestations after requirement, scope, or code changes while preserving history.
- [ ] 3A.17 Link runs, changes, tests, reviews, decisions, and evidence through public contracts using deterministic run fixtures.
- [ ] 3A.18 Keep agent-run state separate from task state and require task-service transition validation.
- [ ] 3A.20 Add project navigation, epic/milestone views, board, and a complete task detail panel.
- [ ] 3A.21 Add TASK-1024 as a fixture with 24-hour validity, expired-session redirect, and regression criteria.
- [ ] 3A.22f Add both compact and engineering boards as projections of the same canonical task status.
- [ ] 3A.22g Add the task detail workspace with plan, criterion results, run selector, activity, changes, tests, and evidence.
- [ ] 3A.22h Attribute human work separately and render run controls disabled until live backend capabilities exist in Phase 6.
- [ ] 3A.22 Test lifecycle guards, stale evidence, concurrent updates, dependency cycles, and cross-workspace denial.
- [ ] 3A.23 Exit: browser E2E proves hierarchy, board mapping, and evidence gates with run fixtures; live controls await Phase 6.

## Phase 3B — Memory Bank and structured documentation

Dependencies: Phase 3A. Deliverable: scoped, versioned project knowledge before live agent execution.
Design: [memory-bank.md](memory-bank.md). This phase belongs to M1.

- [ ] 3B.1 Add the knowledge module with provider, public contracts, owned migrations, version storage, and tests.
- [ ] 3B.2 Define document metadata, source references, freshness, ownership, and draft/approved/stale/superseded/archived states.
- [ ] 3B.3 Create templates for index, project brief, product context, system patterns, technical context, active context, and progress.
- [ ] 3B.4 Add decision, runbook, and lesson references without duplicating task or execution authority.
- [ ] 3B.5 Import authorized existing documentation and record source hashes, branch/revision relevance, and uncertainties.
- [ ] 3B.6 Add knowledge grants and scoped storage, lexical retrieval, indexing, redaction, and access checks.
- [ ] 3B.7 Implement proposed edits, review/publication, optimistic conflicts, version history, and supersession.
- [ ] 3B.8 Mark changed-source knowledge stale and invalidate access/deletion-sensitive retrieval caches.
- [ ] 3B.9 Build the Memory Bank view and authenticated APIs for search, source links, revisions, reviews, and corrections.
- [ ] 3B.10 Implement optional approved Markdown export and conflict-preview import without automatic commit or push.
- [ ] 3B.11 Add retention, deletion, backup/restore, and derived-index rebuild behavior.
- [ ] 3B.12 Exit: fixtures prove structured import, approved revisions, stale detection, permissions, concurrent edits, and restore.

## Phase 4 — Shared chat and model providers

Dependencies: Phases 3, 3A, and 3B. Deliverable: one authenticated conversation across providers.

- [ ] 4.1 Define versioned conversation, message, context, model, backend, and event schemas.
- [ ] 4.2 Refactor native chat and inline chat through the ZCode bridge.
- [ ] 4.3 Reuse compatible Copilot Chat components only after source and API requirements are recorded.
- [ ] 4.4 Add Ask and Plan modes; keep Code unavailable until Phase 6 validates live runner and tool permissions.
- [ ] 4.5 Add model selection, backend selection, file references, selections, diagnostics, and conversation history.
- [ ] 4.6 Keep provider credentials server-side with workspace-scoped configuration and access.
- [ ] 4.7 Implement direct OpenAI, Anthropic, Gemini, and Ollama adapters behind ModelProvider.
- [ ] 4.8 Normalize text, streaming, tool calls, errors, usage, cancellation, and provider capability limits.
- [ ] 4.9 Switch models between turns using normalized history and visible provider attribution.
- [ ] 4.10 Add reconnect cursors, stream backpressure, duplicate suppression, and context export rules.
- [ ] 4.11 Test tool-schema mismatch, rate limits, expired credentials, unavailable models, and unsupported features.
- [ ] 4.11a Define task linking and test write-dispatch guards with fixtures; keep Ask conversations available without tasks.
- [ ] 4.11b Show task identity, acceptance criteria, detailed status, subtasks, and linked runs in shared chat.
- [ ] 4.12 Exit: two live providers work in one chat; remaining adapters have explicit live-test status.

## Phase 5 — Workspace tools and language intelligence

Dependencies: Phases 3, 3A, 3B, and Phase 4 contracts. Deliverable: policy-controlled coding operations.

- [ ] 5.1 Define Tool, Workspace, Policy, Approval, and ExecutionProfile ports and registry contracts.
- [ ] 5.2 Implement local fixture and isolated Docker workspace adapters.
- [ ] 5.3 Reject path traversal, symlink/junction escapes, stale file versions, and secret-file retrieval.
- [ ] 5.4 Add read, write, patch, search, directory, package, dependency, and environment tools.
- [ ] 5.5 Add command, process, test, lint, and typecheck tools with bounded output and process-tree cleanup.
- [ ] 5.6 Add Git status, diff, log, and branch tools; grant commit and push separately.
- [ ] 5.7 Add per-workspace write leases and conflict checks against human edits and unsaved buffers.
- [ ] 5.8 Bridge TypeScript/JavaScript diagnostics, symbols, definitions, references, and rename through language services or LSP.
- [ ] 5.9 Add Tree-sitter indexing fallback and explicit unsupported-language behavior.
- [ ] 5.10 Build focused repository, rule, Git, test, error, and dependency context with source provenance.
- [ ] 5.10a Combine Task, Repository, Git, Runtime, and Agent Memory context into versioned run snapshots.
- [ ] 5.10b Test relevance limits, stale context, source attribution, unsaved buffers, and unauthorized context exclusion.
- [ ] 5.10c Retrieve authorized Memory Bank sections with document/version citations and record them in bounded Agent Context snapshots.
- [ ] 5.10d Verify stale knowledge and unavailable retrieval cannot bypass required decisions or permission checks.
- [ ] 5.11 Apply resource, mount, environment, network, timeout, and cancellation controls.
- [ ] 5.12 Exit: tool and isolation fixtures pass; inline changes preserve conflicting human edits.

## Phase 6 — Workflow, state, and native coding loop

Dependencies: Phases 4–5. Deliverable: first complete agent coding scenario.

- [ ] 6.1 Finalize AgentBackend capabilities and task/run/workflow/checkpoint/effect contracts on the Phase 3A schemas.
- [ ] 6.5 Persist ZCode authoritative state and checkpoint references using module-owned repositories.
- [ ] 6.6 Record ordered events, effect intents, idempotency keys, and completed effects.
- [ ] 6.8 Enforce time, iteration, tool-call, context, and cost budgets with explicit unknown usage.
- [ ] 6.9f Translate criteria into versioned verification plans with unit, integration, E2E, typecheck, lint, and manual checks.
- [ ] 6.9g Link verification attempts and artifacts to criterion version, source digest, actor/run, environment, and result.
- [ ] 6.9h Keep unsupported or inconclusive criteria incomplete and reject unauthorized weakening of acceptance criteria.
- [ ] 6.2 Implement LangGraph JavaScript behind WorkflowEngine for the outer engineering stages.
- [ ] 6.3 Add LangChain model/retrieval helpers only where a documented adapter benefit exists.
- [ ] 6.4 Implement one native model/tool runner with bounded repair and verification gates.
- [ ] 6.7 Implement pause, resume, cancel, retry, crash reconciliation, and read-only replay.
- [ ] 6.9 Connect live controls, Code mode, revocation hooks, plans, approvals, output, diffs, and timeline.
- [ ] 6.9a Map workflow steps to task transitions through the task service and retain run-level pause/failure/cancel states.
- [ ] 6.9b Attach file, test, review, and decision evidence to exact task criteria and source revisions.
- [ ] 6.9c Prevent run success from automatically completing a task with unmet criteria or incomplete children.
- [ ] 6.9d Record reproducibility metadata, incremental context, per-run files/tests, and immutable attempt history.
- [ ] 6.9e Implement distinct resume, retry-as-new-run, replay-without-execution, and backend-switch behavior.
- [ ] 6.9i Revalidate blocking prerequisites at dispatch and reassess dependents when a prerequisite reopens.
- [ ] 6.9j Establish the automation module and AutomationPlan/Execution persistence; add TaskDocument parsing for an authorized task.md path, phase range, stable IDs, and explicit source order.
- [ ] 6.9k Preview an AutomationPlan with document hash, task mapping, prerequisites, verification gates, budgets, and approval scope.
- [ ] 6.9l Implement approve/start/pause/resume/cancel actions with scoped capabilities and an attributable approval record.
- [ ] 6.9m Execute selected items sequentially, with separate task runs and dependency checks before each dispatch.
- [ ] 6.9n Stop on unresolved external prerequisites, conflicting order, or required human review without silently expanding scope.
- [ ] 6.9o Persist AutomationExecution cursor, worker lease, checkpoints, and per-task/whole-execution limits.
- [ ] 6.9p Update checkboxes only after verified completion using conflict-safe document writes and recorded expected hashes.
- [ ] 6.9q Pause on changed selected instructions or expired/revoked approval and preview the revised scope before continuation.
- [ ] 6.9r Reconcile prechecked items, restart recovery, and failed progress synchronization without duplicate execution.
- [ ] 6.9s Show automation progress and summarize completed, blocked, failed, skipped, and untested work with evidence.
- [ ] 6.9t Propose Memory Bank updates from task/run evidence; preserve review gates and authoritative task status.
- [ ] 6.9u Parse only selected numbered phase checklists; exclude example templates and preserve stable IDs on document reorder.
- [ ] 6.10 Exit: direct-model repair, revocation, approved task.md sequencing, checkbox synchronization, and restart recovery pass.

## Phase 6A — Mobile and laptop API control

Dependencies: Phase 6. Deliverable: approved remote work through the same task and run services.
This phase belongs to M1 and can proceed alongside Phase 7.

- [ ] 6A.1 Define versioned API contracts for task-run triggers, automation preview, approval, start, status, and control actions.
- [ ] 6A.2 Add authenticated HTTPS/private-network routing without exposing editor, backend, or runtime ports directly.
- [ ] 6A.3 Support protected browser sessions and revocable scoped API credentials with authorization, CSRF controls, and rate limits.
- [ ] 6A.4 Accept selected task.md paths, phases, task order, and limits; bind approval to the resolved manifest revision and digest.
- [ ] 6A.5 Return durable asynchronous operation IDs and implement idempotency with request-content conflict detection.
- [ ] 6A.6 Add status polling and authenticated reconnectable event streams for intermittent mobile connections.
- [ ] 6A.7 Add responsive task controls for preview, approve, start, pause, resume, cancel, progress, review, and evidence.
- [ ] 6A.8 Resolve concurrent mobile/laptop actions using expected state revisions and attributable audit records.
- [ ] 6A.9 Document laptop API examples and phone-browser flows without embedding credentials or requiring a native mobile app.
- [ ] 6A.10 Exit: mobile-trigger/laptop-review E2E proves durable execution, retry deduplication, revocation, and control conflicts.

## Phase 7 — OpenCode integration

Dependencies: Phase 6 and OpenCode compatibility evidence. Deliverable: M1 daily coding foundation.

- [ ] 7.1 Verify OpenCode against the Phase 6 AgentBackend contract and record capability differences.
- [ ] 7.2 Connect the pinned OpenCode SDK/server with isolated workspace configuration.
- [ ] 7.3 Expose OpenCode provider/model discovery in the shared chat settings.
- [ ] 7.4 Map OpenCode sessions, messages, tool activity, permissions, and errors to ZCode contracts.
- [ ] 7.5 Preserve ZCode conversation history with backend session IDs and event provenance.
- [ ] 7.6 Prevent an outer native runner from starting a competing inner agent loop.
- [ ] 7.7 Verify built-in shell, file, MCP, and skill paths cannot bypass effective workspace policy.
- [ ] 7.8 Report unsupported approval or resume behavior and disable affected capabilities.
- [ ] 7.9 Test live execution, cancellation, reconnect, server restart, and denied tools.
- [ ] 7.10 Exit: OpenCode completes the login-test repair through the same chat with permission evidence.

## Phase 8 — OpenHands Software Agent SDK

Dependencies: Phase 7 backend contracts. Deliverable: interchangeable OpenHands execution.

- [ ] 8.1 Pin OpenHands SDK/server and define its Python service image and TypeScript/REST client boundary.
- [ ] 8.2 Implement OpenHandsBackend session, event, tool, approval, error, and checkpoint mapping.
- [ ] 8.3 Scope runtime credentials and mounts to the assigned user and workspace.
- [ ] 8.4 Expose backend capabilities accurately without assuming OpenCode parity.
- [ ] 8.5 Enforce the same denied-action, cancellation, revocation, and budget contracts.
- [ ] 8.6 Verify no hidden tool, shell, browser, or network path escapes effective policy.
- [ ] 8.7 Handoff normalized context between stopped backend runs without copying opaque internal state.
- [ ] 8.8 Exit: the live OpenHands repair scenario passes through the same chat and audit trail.

## Phase 9 — Agent skills, repository skills, MCP, and richer context

Dependencies: Phases 5–8. Deliverable: governed extensions for daily coding.

- [ ] 9.1 Discover repository guidance and versioned SKILL.md packages with origin and trust metadata.
- [ ] 9.2 Implement relevant-resource loading and organization/user/repository instruction precedence.
- [ ] 9.3 Keep skill scripts behind execution permission; prevent instructions from granting capabilities.
- [ ] 9.4 Persist approved repository knowledge separately from generated session summaries.
- [ ] 9.5 Add MCP server configuration, discovery, credential references, health, and lifecycle controls.
- [ ] 9.6 Validate schemas and require grants for new or changed MCP tools.
- [ ] 9.7 Enforce permission, output, timeout, and audit rules for every MCP invocation.
- [ ] 9.8 Integrate the public remote-operations MCP contract only for explicitly selected operations.
- [ ] 9.9 Add Python language intelligence and test index invalidation after edits and branch changes.
- [ ] 9.10 Exit: skill-guided edits, an MCP operation, and symbol rename pass with attributable context and events.

## Phase 10 — Playwright and browser coding tools

Dependencies: Phase 9. Deliverable: M2 extensible execution.

- [ ] 10.1 Add an isolated browser runtime and BrowserTool adapter with per-workspace sessions.
- [ ] 10.2 Add navigation, element inspection, interaction, screenshots, and console/network collection.
- [ ] 10.3 Enforce destination and credential boundaries, including redirects and downloads.
- [ ] 10.4 Attach browser evidence to the coding run with redaction and retention rules.
- [ ] 10.5 Connect application previews to controlled test and repair workflows.
- [ ] 10.6 Extend the Phase 0 Playwright harness and earlier UI tests with agent-browser isolation and browser-driven repair.
- [ ] 10.7 Exit: an agent fixes a visible application defect and independent E2E verifies the result.

## Phase 11 — Optional computer use and reliability

Dependencies: Phase 10. Reliability tasks 11.5–11.7 are mandatory.
Computer-use tasks 11.1–11.4 may be explicitly deferred with reasons; the feature stays disabled.

- [ ] 11.1 Define sandbox desktop, screenshot, input, clipboard, and file-transfer contracts.
- [ ] 11.2 Implement an isolated desktop adapter with computer.use grants and no host desktop attachment.
- [ ] 11.3 Add cleanup, interruption, observation limits, and credential protection.
- [ ] 11.4 Test desktop actions and prevent cross-session screenshot or input access.
- [ ] 11.5 Measure startup, chat latency, indexing cost, and sustained daily-session resource use.
- [ ] 11.6 Test simultaneous users, write contention, slow clients, reconnect storms, and process leaks.
- [ ] 11.7 Exit: enabled desktop features pass isolation tests; measured performance targets are met.

## Phase 12 — Complete E2E, upgrades, and handoff

Dependencies: Phases 0–10 including 3A, 3B, and 6A, plus Phase 11 reliability and any enabled computer-use features. Deliverable: M3 daily-use candidate.

- [ ] 12.1 Verify Owner login, membership assignment, Developer edits, and Reviewer/Viewer read-only access.
- [ ] 12.2 Verify direct file, terminal, extension, preview, WebSocket, and API bypass attempts fail.
- [ ] 12.3 Run login-test repair through native, OpenCode, and OpenHands backends with live integrations.
- [ ] 12.4 Switch providers in one conversation and verify context continuity and attribution.
- [ ] 12.5 Deny approval and revoke membership mid-run; verify no pending write executes.
- [ ] 12.6 Reconnect the editor and restart the API during work; verify no duplicate side effects.
- [ ] 12.7 Cancel each backend and verify child processes, browser sessions, and temporary runtimes stop.
- [ ] 12.8 Verify manual edit conflicts, unsaved-buffer versions, and workspace write leases.
- [ ] 12.9 Verify skills, MCP, language tools, browser repair, and enabled computer tools end to end.
- [ ] 12.10 Verify two users cannot read or mutate each other's state, files, credentials, or previews.
- [ ] 12.11 Upgrade the pinned editor and adapters, replay patches, and run the compatibility matrix.
- [ ] 12.12 Restore state from backup and roll back the editor image without deleting workspace data.
- [ ] 12.13 Run scoped formatting, types, lint, boundaries, module, integration, browser, and Docker checks.
- [ ] 12.14 Record live versus fixture coverage, revision, commands, artifacts, dates, and unresolved limitations.
- [ ] 12.15 Update module documentation, operational procedures, and the active changelog entry.
- [ ] 12.15a Verify workspace/project/epic/task/subtask hierarchy and milestone progress without duplicate counting.
- [ ] 12.15b Drive TASK-1024 through all detailed states and verify Todo/Doing/Done mapping after reload.
- [ ] 12.15c Verify unmet dependencies, incomplete children, stale reviews, and missing evidence prevent DONE.
- [ ] 12.15d Verify multiple backend runs retain task identity, branch evidence, decisions, and criterion links.
- [ ] 12.15e Reopen a task, change its requirements, and verify affected attestations require fresh evidence.
- [ ] 12.15f Show failed Qwen Run #1 and completed Claude Run #2 on TASK-1024 without losing either attempt's history.
- [ ] 12.15g Verify the TASK-101 → TASK-104 blocking chain and prove related links do not block dispatch.
- [ ] 12.15h Switch board views and inspect task details; verify selected-run logs, counts, plans, and controls after reload.
- [ ] 12.15i Verify checkout success, invalid-card errors, no order on payment failure, and regression evidence using test fixtures.
- [ ] 12.15j Verify Human and Agent assignments retain human accountability and never grant extra workspace access.
- [ ] 12.15k Approve a fixture task.md phase range and verify exact execution order and evidence-backed checkbox updates.
- [ ] 12.15l Reject unauthorized execution, duplicate IDs, order/dependency conflicts, and out-of-scope prerequisites.
- [ ] 12.15m Restart the runner mid-phase and verify leased recovery without duplicate writes or lost progress.
- [ ] 12.15n Change selected task instructions during execution and verify pause and approval renewal.
- [ ] 12.15o Verify cancellation, permission revocation, budget exhaustion, review pauses, and Markdown sync conflicts.
- [ ] 12.15p Trigger an approved phase range from a mobile client, disconnect, and inspect/review completion from a laptop.
- [ ] 12.15q Repeat API requests after a lost response and verify one execution; reject payload changes using the same idempotency key.
- [ ] 12.15r Verify remote HTTPS access, expired credentials, cross-workspace denial, conflicting controls, and event-stream recovery.
- [ ] 12.15s Verify task completion → knowledge proposal → approval → new-run retrieval across restart and model/backend changes.
- [ ] 12.15t Verify knowledge freshness, source citations, conflicting edits, injection defense, revocation, deletion, export/import, and restore.
- [ ] 12.16 Exit: all required evidence passes before marking the daily-use milestone complete.

## Phase 14 — Organization access, usage, budgets, and audit

Dependencies: Phase 12. Deliverable: organization controls before team sharing.

- [ ] 14.1 Integrate organization/team membership through public identity contracts and retain accountable human owners.
- [ ] 14.2 Add Team assignment with explicit repository/workspace grants and no implicit cross-team access.
- [ ] 14.3 Intersect organization, team, workspace, user, automation, and agent capability restrictions at dispatch and tool execution.
- [ ] 14.4 Govern models, tools, paths, branches, secrets, destinations, runtime profiles, retention, and required reviews.
- [ ] 14.5 Version policy edits and apply revocation and scoped expiring exceptions to active executions.
- [ ] 14.6 Attribute tokens, cost, runtime, storage, browser usage, and concurrency without double counting.
- [ ] 14.7 Reserve budgets atomically before dispatch and reconcile estimated, actual, and unknown usage.
- [ ] 14.8 Add soft alerts, hard limits, rate limits, budget periods, usage dashboards, and authorized exports.
- [ ] 14.9 Audit every supported user, workflow, tool, approval, template, review, billing-limit, and administrative action.
- [ ] 14.10 Implement durable append-only audit records with integrity checks, redaction, retention, and restricted search/export.
- [ ] 14.11 Record direct editor/terminal effects and publish explicit instrumentation limits for subprocess auditing.
- [ ] 14.12 Test concurrent budget admission, revoked grants, policy weakening attempts, audit outages, and secret redaction.
- [ ] 14.13 Exit: access and usage limits hold under concurrent runs, and audit records reconstruct each tested workflow.

## Phase 13 — Shared automation catalog and successful patterns

Dependencies: Phase 14. Deliverable: reusable definitions with recipient-owned bindings.
Design: [automation.md](automation.md). Phases 13–16 deliver M4 team automation.

- [ ] 13.1 Extend the Phase 6 automation module with versioned definitions and recipient-owned bindings.
- [ ] 13.2 Convert a selected successful task and its runs into a parameterized automation draft.
- [ ] 13.3 Remove secrets, private conversation data, local paths, and incidental repository values during conversion.
- [ ] 13.4 Preserve provenance and add input schemas, capability requirements, verification plans, and examples.
- [ ] 13.5 Implement draft, validated, published, deprecated, and revoked catalog states with versioned approval.
- [ ] 13.6 Share catalog references using recipient-owned repository and credential bindings; do not copy prompts per team.
- [ ] 13.7 Evaluate fixtures across repositories for success, cost, duration, corrections, and failure modes before promotion.
- [ ] 13.8 Pin execution versions and implement upgrade previews, rollback, revocation, and template ownership transfer rules.
- [ ] 13.9 Exit: two teams reuse one validated automation version with separate resource bindings and isolated evidence.

## Phase 15 — Workflows across repositories and teams

Dependencies: Phases 14 and 13. Deliverable: authorized dependency-driven execution across registered repositories.

- [ ] 15.1 Define workflow graphs with workspace/project/repository nodes, team owners, and prerequisite evidence edges.
- [ ] 15.2 Validate expanded graphs for cycles and resolve each node's access and budget independently.
- [ ] 15.3 Extend same-project task restrictions only through approved workflow edges; retain one repository per task.
- [ ] 15.4 Add explicit team handoff and artifact-transfer grants without exposing unrelated context or credentials.
- [ ] 15.5 Use pinned revisions, isolated execution branches/checkouts, and per-node write leases.
- [ ] 15.6 Dispatch sequentially first; permit independent-node concurrency only with isolated writable scopes.
- [ ] 15.7 Preserve completed node evidence during partial failure and pause dependent nodes with recovery options.
- [ ] 15.8 Scope retries and any compensation actions explicitly; never automatically merge or revert cross-repository changes.
- [ ] 15.9 Exit: schema/API → frontend → integration workflow passes across two repositories and teams; denied access and partial failures remain contained.

## Phase 16 — Automated code review and M4 acceptance

Dependencies: Phase 15. Deliverable: repeatable quality gates and complete team-automation verification.

- [ ] 16.1 Add a read-only review workflow using the existing backend/profile contract and configured static checks.
- [ ] 16.2 Bind review inputs to exact diff/revision, task requirements, acceptance criteria, and repository coding standards.
- [ ] 16.3 Return deduplicated findings with severity, location, evidence, correction guidance, and check provenance.
- [ ] 16.4 Persist review runs and model/tool versions; invalidate affected attestations when code or standards change.
- [ ] 16.5 Enforce organization quality thresholds and human review requirements with attributable override decisions.
- [ ] 16.6 Start authorized repairs as separate coding attempts; require separate permission for external review comments.
- [ ] 16.7 Evaluate seeded bugs, missing tests, boundary violations, injection attempts, stale diffs, and false positives.
- [ ] 16.8 Verify task-to-template conversion and two-team reuse without secret leakage or prompt duplication.
- [ ] 16.9 Verify cross-repository dispatch, handoff, partial failure, retries, revocation, and independent grants end to end.
- [ ] 16.10 Verify concurrent budget limits and audit reconstruction from remote trigger through final review.
- [ ] 16.11 Record measured quality, cost, false-positive rate, coverage limits, and template compatibility evidence.
- [ ] 16.11a Verify shared automation does not expose private Memory Bank content and explicit approved patterns transfer only within recipient grants.
- [ ] 16.11b Complete the requirement-to-phase review, evidence index, remaining-risk record, and documentation link checks before final handoff.
- [ ] 16.12 Exit: all requested M4 checks pass before enabling organization-wide automation and mandatory review gates.

## Completion record format

### Product task template

Use this record for product tasks. Values below are illustrative, not completed work.

| Field               | TASK-1024 example                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity            | TASK-1024 plus immutable internal ID, project/workspace IDs, timestamps, and revision.                                                               |
| Description         | Fix login session expiration.                                                                                                                        |
| Requirements        | Fixed 24-hour lifetime from issuance; reject expired sessions and redirect protected pages.                                                          |
| Acceptance Criteria | AC-1: Session remains valid for 24 hours, except logout/revocation. AC-2: Expired sessions redirect to login. AC-3: Existing tests continue passing. |
| Priority            | High.                                                                                                                                                |
| Status              | BACKLOG, displayed in Todo.                                                                                                                          |
| Assignee            | Human or Agent after triage, with an authorized accountable human owner.                                                                             |
| Dependencies        | Record prerequisite task IDs before READY.                                                                                                           |
| Parent / Child      | Link an epic and optional parent; split implementation and verification into subtasks if useful.                                                     |
| Repository          | Select the project's registered application repository.                                                                                              |
| Branch              | Record target branch and resolve execution branch/base revision before writes.                                                                       |
| Context             | Link session code, repository rules, diagnostics, and current test baseline.                                                                         |
| Agent Runs          | Append each attempt, backend, model, execution workspace, and outcome.                                                                               |
| Files Changed       | Attach actual paths, source hashes, and reviewable diffs after execution.                                                                            |
| Tests               | Attach controlled-clock boundary tests, redirect E2E, and existing regression results.                                                               |
| Reviews             | Record verdict against the current diff/revision.                                                                                                    |
| Decisions           | Record fixed versus sliding expiry rationale and any superseding decisions.                                                                          |
| Evidence            | Link each criterion to its test artifacts, revision, environment, and review.                                                                        |

TASK-1024 fixture acceptance checklist:

- [ ] Verify session validity just before the 24-hour boundary with a controlled clock.
- [ ] Verify expiry at 24 hours and protected API rejection.
- [ ] Verify redirection when an expired user next accesses a protected page.
- [ ] Verify explicit logout and revocation still end the session early.
- [ ] Verify the recorded existing regression suite passes on the changed revision.
- [ ] Verify review and all required evidence before transitioning to DONE.

These unchecked items define the fixture. They do not change ZCode session policy.

### Implementation evidence

For each checked task, append:
`ID | revision | command/scenario | environment | result | date | evidence link | limitation`.

Release publication, remote workspace support, and coordinated multi-agent editing
require later tasks. They do not block the scoped daily coding milestones above.
