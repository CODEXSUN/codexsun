# Execution Status

Presentation-only block, version `1.0.0`, owned by `packages/ui`.
Import `ExecutionStatus` from `@codexsun/ui/blocks/execution-status`.

Applications supply `state`, `title`, `description`, `elapsed`, and labeled `metrics`.
States are `active`, `idle`, `complete`, and `attention`. Only active state animates.
Set `animated={false}` to pause motion. Operating-system reduced motion also disables animation.
The ring and indeterminate bar indicate activity, not a completion percentage.
The caller must stop active presentation when its observations become stale.

This block owns no timer, network request, application status mapping, or persistence.
The UIUX gallery demonstrates each state with explicitly labeled sample values.
Zetro supplies observed task state and public snapshot counts.

## Development records

- [Live execution visuals](../../../../../assist/records/zetro/2026-09-10-live-execution-visuals.md)
