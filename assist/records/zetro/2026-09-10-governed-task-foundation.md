# Governed task foundation

## Intention and bindings

The [implementation task](../../tasks/zetro-governed-development.md) defines the target lifecycle and release hold.
Chat owns planning. Project Tasks owns objectives. System Tasks owns attempts. Automation coordinates checks and delivery.
Scripts cannot approve results. Human acceptance must bind to the candidate revision and patch digest.
Sites development is paused until installed acceptance passes.

## Initial code change

Tasks API rejects nonexistent and cross-project parents.
It rejects adding work to completed or archived parents and completing parents with unfinished children.
Archived unfinished children still block completion. Reopening a child requires an open parent.
Routes map policy failures to HTTP 409. No migration or existing task rewrite occurs.
Legacy manual done remains planning status, not proof of green verification.

## Parallel work

Preserved the previous Codex Connection worktree preparation changes.
No installed executable, existing task record, chat, account, or running service was changed.

## Verification and remaining work

The focused task test covers parent isolation, unfinished and archived child checks, and reopening behavior.
Task tests, API typecheck, lint, module boundaries, module documentation, file lengths, and diff whitespace checks passed.
See the task checklist for the unimplemented coordinator, approval inbox, candidate evidence, delivery binding, and installed acceptance.
This record does not claim completion of the full workflow.

## Planning boundary

Chat now defaults to Plan. Plan and Review use the provider read-only sandbox and skip write-folder preparation.
The visible handoff creates a task draft. It does not run an implementation attempt.
The API rejects unknown workflow values and stores Plan for legacy execution records that omit a workflow.
Focused connection and workflow tests passed. API and web typechecks, lint, tests, and builds passed without warnings.
The main web JavaScript chunk is 374.99 kB, below the 400 kB limit.
Installed-desktop and live-provider acceptance remain unverified.
