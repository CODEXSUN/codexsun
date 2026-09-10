# Execution Status

Presentation-only block, version `1.1.0`, owned by `packages/ui`.
Import `ExecutionStatus` from `@codexsun/ui/blocks/execution-status`.

Applications supply `state`, `title`, `description`, `elapsed`, and labeled `metrics`.
States are `active`, `idle`, `complete`, and `attention`. Only active state animates.
Set `animated={false}` to pause motion. Operating-system reduced motion also disables animation.
The ring and indeterminate bar indicate activity, not a completion percentage.
The caller must stop active presentation when its observations become stale.

This block owns no timer, network request, application status mapping, or persistence.

Optional `checks` show passed, failed, checking, pending, and expired results with icons and text.
`ExecutionChecks` exports the same checklist for settings panels. Applications own the state mapping.
Optional `actions` compose application callbacks. `splash` uses a full-page startup surface with a compact/details control.
The splash does not grant readiness or block API access. The owning application controls those decisions.
The UIUX gallery demonstrates each state with explicitly labeled sample values.
Zetro supplies observed task state and public snapshot counts.

## Development records

- [Startup readiness](../../../../../assist/records/zetro/2026-09-10-startup-readiness.md)

- [Live execution visuals](../../../../../assist/records/zetro/2026-09-10-live-execution-visuals.md)
