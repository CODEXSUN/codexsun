# Zetro Automation

This module owns the deterministic Automation workspace in Zetro web and desktop.

Module version: `0.4.0`.

The shared `ExecutionStatus` block displays the observed state, elapsed time, and snapshot counts.
Active runs show a ring and indeterminate bar. Queued, stale, and terminal runs do not animate.
View options can pause motion. Reduced-motion settings also disable animation.
The display estimates neither completion percentage nor business release readiness.

## Observation pages

Automation has separate full-page Live runs, History, and Scripts and maintenance views
inside the existing `/zetro` desk. Open a row or sidebar run for its full-page detail.
Back returns to the originating list. Starting a script opens the resulting task.
These are desk pages, not new public URL routes.

Details show the full instruction, duration, durable steps, reported tool actions,
saved response, errors, and a downloadable text report. Stop requires confirmation.
Diagnosis prepares a draft and never sends it automatically. There is no automatic retry.

The System Tasks provider polls every two seconds while visible. The floating connection
card shows the last received update. Operations metrics refresh every five seconds.
API memory belongs to the whole Zetro process, not one run. The outcome bar describes
loaded history, not predicted progress. Unavailable metrics remain unavailable.

Supervisor jobs now publish bounded public response and tool snapshots during execution.
The UI reads them through task polling. Older runs without snapshots show final evidence only.
Repository script output still appears at completion. This is not an SSE or WebSocket transport.
The view-options popover can hide the connection card. It changes presentation only.

All controls and cards use public `@codexsun/ui` exports. Automation owns projection,
page selection, filtering, report content, and action callbacks. No database change is needed.

It lists repository-owned npm scripts, starts durable System Tasks, exposes diagnostics and worktree retention controls, and embeds the governed Git Delivery flow. It does not own Git commands, process execution, or execution persistence.

Agent supervision is opt-in. A failed run can prepare a diagnostic prompt in Agent Chat. The prompt forbids rerunning, publishing, cleanup, and repository mutation until the user reviews the diagnosis.

## Shared UI audit

The **Shared UI** automation runs the repository-owned `check:ui-system` script as a durable
System Task. It checks every web application for public `@codexsun/ui` use, private package
imports, direct UI-library dependencies, app-local primitive folders, and native controls that
have shared equivalents.

The command returns one result per web application with scanned file and public-import counts.
Use **Diagnose with agent** after a failed run. The supervisor receives the recorded violations
and must preserve application business composition while moving only reusable UI to `packages/ui`.

## Development records

- [2026-09-10 Live execution visuals](../../../../../../assist/records/zetro/2026-09-10-live-execution-visuals.md)

- [2026-09-10 Automation observation pages](../../../../../../assist/records/zetro/2026-09-10-automation-observation.md)

- [2026-09-09 Deterministic automation CLI](../../../../../../assist/records/zetro/2026-09-09-deterministic-automation-cli.md)
- [2026-09-10 Shared UI automation audit](../../../../../../assist/records/zetro/2026-09-10-shared-ui-automation-audit.md)
