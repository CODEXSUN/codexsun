# Codeit UI and work flows

Status: planned. Use shared CODEXSUN components and inspect current UIUX examples before implementation.

## Work surface

Keep Top Menu, Side Menu, App Header, Workspace Canvas, and Status Bar within AppLayout.
Preserve the exact `mainLayoutTechnicalNames` values.
The desktop layout has a project/conversation sidebar, central chat/work canvas, and an optional inspector.
The bottom panel can show terminal output, diagnostics, tests, and run events.
Only open panels the current task needs. Preserve the current conversation when panels change.
On narrow screens, open navigation and the inspector as controlled sheets with focus restoration.

| Surface      | Contents and behavior                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| Top menu     | Project context, search, command palette, tool/plugin health, user/settings  |
| Sidebar      | Projects, conversations, tasks, runs, archived work                          |
| App header   | Project, conversation title, mode, active run, primary action                |
| Chat canvas  | Messages, context references, streaming, tool cards, plan and task artifacts |
| Inspector    | Selected file/diff, plan revision, worker details, approval, test evidence   |
| Bottom panel | Bounded terminal output, diagnostics, test report, event timeline            |
| Status bar   | Model/provider, runtime state, branch/workspace, budget, active worker count |

## Composer

Provide Ask, Plan, Work, and Review mode selection, model selection, context attachments, and Send/Stop.
Show chosen project, allowed capabilities, and relevant context before sending.
Use file/project mention suggestions from the authorized workspace catalog.
Do not accept a mention as permission to read outside the project.
Keep drafts through navigation. Disable duplicate submission while preserving an explicit new request action.
Support keyboard submission, multiline input, accessible labels, and visible focus.
User steering attaches to the active run with a recorded scope update.
Incompatible steering pauses dependent work and requests a scope decision.

## Mode behavior

| Mode   | Enabled behavior                           | Default mutation policy                                    |
| ------ | ------------------------------------------ | ---------------------------------------------------------- |
| Ask    | Read and explain selected context          | No source changes or commands                              |
| Plan   | Inspect context and produce plan artifacts | No project source mutation                                 |
| Work   | Execute authorized tasks and checks        | Explicit project grants and enforced runner boundary       |
| Review | Inspect exact changes and evidence         | Findings only, unless a later fix request authorizes edits |

Mode changes update backend policy. A frontend toggle alone cannot grant tools.
Plan artifacts are Codeit-owned records, not permission to change source.

## Chat to work

1. Submit a request in the selected project and mode.
2. Show accepted scope, unresolved decisions, and selected context.
3. Produce a versioned plan with tasks, dependencies, owners, and acceptance tests.
4. Let the user correct the plan or authorize bounded implementation.
5. Show supervisor and worker progress as actual persisted events.
6. Present tool intent, results, and approval cards where policy requires them.
7. Open changed files and evidence in the inspector.
8. Run verification and independent review.
9. Report the outcome, changes, checks, remaining work, and exact revision.

## Artifact and approval cards

Plan cards show revision, scope, decisions, dependencies, and acceptance conditions.
Task cards show owner, state, file lease, budget, blockers, and verification status.
Tool cards show capability, purpose, target, execution status, output artifact, and failure reason.
Approval cards show the exact action, target, changed content digest, expiry, and effect.
Do not default to broad permanent approval. Denial is a supported outcome.
Diff cards show before/after changes and conflicts against the current file hash.
Evidence cards distinguish automated checks, browser observation, provider evaluation, and unverified behavior.

## Settings

Use separate sections for Runtime, Providers, Tools, Plugins, Personalization, Workers, and Data retention.
Show connection health without revealing secrets.
Show unavailable capability reasons and test-connection results.
Personalization supports source/provenance, scope, edit, confirm, and forget.
Worker settings control concurrency and budgets within backend ceilings.
Tool/plugin disable actions warn only about real affected running work and record the resulting cancellation or denial.

## Design acceptance

Review desktop at 1440×900 and a narrow viewport at 390×844 when browser tooling supports it.
Record the actual viewport if the tool enforces a different size.
Verify no horizontal clipping, accessible keyboard navigation, readable contrast, and sensible panel resizing.
Use `DD-MM-YYYY` and `DD-MM-YYYY HH:mm` for displayed dates and times.
Include empty, loading, provider unavailable, policy denied, conflict, cancelled, interrupted, and retry states.
Use shared forms, selects, lookup, banners, status badges, tables, show, and upsert primitives where applicable.
Keep primary actions clear. Do not expose debug implementation details in normal user flows.
