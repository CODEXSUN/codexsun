# Zetro Automation

This module owns the deterministic Automation workspace in Zetro web and desktop.

It lists repository-owned npm scripts, starts durable System Tasks, exposes diagnostics and worktree retention controls, and embeds the governed Git Delivery flow. It does not own Git commands, process execution, or execution persistence.

Agent supervision is opt-in. A failed run can prepare a diagnostic prompt in Agent Chat. The prompt forbids rerunning, publishing, cleanup, and repository mutation until the user reviews the diagnosis.

## Development records

- [2026-09-09 Deterministic automation CLI](../../../../../../assist/records/zetro/2026-09-09-deterministic-automation-cli.md)
