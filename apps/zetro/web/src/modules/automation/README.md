# Zetro Automation

This module owns the deterministic Automation workspace in Zetro web and desktop.

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

- [2026-09-09 Deterministic automation CLI](../../../../../../assist/records/zetro/2026-09-09-deterministic-automation-cli.md)
- [2026-09-10 Shared UI automation audit](../../../../../../assist/records/zetro/2026-09-10-shared-ui-automation-audit.md)
