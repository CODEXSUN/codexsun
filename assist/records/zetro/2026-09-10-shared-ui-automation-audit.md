# Shared UI Automation Audit

Date: 2026-09-10

## Outcome

CODEXSUN now has one structured shared UI audit for all web applications. The root check, Zetro
CLI, and Zetro Automation workspace run the same deterministic `check:ui-system` script.

## Authoritative references

- Owner README: [Zetro Automation](../../../apps/zetro/web/src/modules/automation/README.md)
- Application catalog: [Zetro modules](../../modules/zetro.md)
- Architecture contract: [UI design system](../../architecture/ui-design-system.md)
- Local skill: [Web UI](../../skills/web-ui.md)

## Ownership and boundaries

The root tooling owns static source and dependency checks. `packages/ui` remains the only reusable
UI source owner. Each application keeps its business data, workflows, and screen composition.
Zetro starts and records the repository script. It does not reimplement the audit.

## Binding properties

| Producer           | Consumer            | Binding                    | Version or key               |
| ------------------ | ------------------- | -------------------------- | ---------------------------- |
| Root tooling       | Quality gate        | `auditSharedUi`            | `check:ui-system`            |
| Zetro CLI          | Developer Tools API | repository script task     | `ui-audit`                   |
| Zetro Automation   | System Tasks        | repository script task     | `check:ui-system`            |
| Failed System Task | Agent Chat          | reviewed diagnostic prompt | `zetro.automation.web` 0.2.0 |

## Parallel work

The workspace contained concurrent UI application, Docs, Orship, Platform, Zetro, runtime, and
shared UI changes. This work preserved them and did not restore, move, stage, or reformat their
files. Gallery ownership discovery uses the current application module instead of a fixed app name.

## Decisions

- Decision: Keep one audit engine and expose it through root, CLI, and Automation entry points.
- Reason: One implementation prevents browser, desktop, terminal, and CI policy drift.
- Rejected alternative: An agent-only audit cannot provide repeatable exit codes or stable evidence.

## Verification

- Command: `npm.cmd run audit:shared-ui`
- Command: `npm.cmd run audit:shared-ui -- --app zetro --format json`
- Command: `npm.cmd run test:tooling`
- Command: focused Zetro CLI and web tests, type checks, lint, and builds.
- Not run: Live API task execution, browser interaction, desktop launch, and installer installation.

## Follow-up work

Add the same repository script to another repository before Zetro can audit that repository.
