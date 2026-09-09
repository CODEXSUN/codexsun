# Zetro Agent Workspace Rails

Date: 2026-09-09

## Outcome

Zetro now composes the shared Agent Workspace layout inside MDI Main. Chat,
Tasks, and Automation use the fixed Primary Activity Rail. Connected folder
and Repository tools use the fixed Secondary Utility Rail.

## Ownership

- `packages/ui` continues to own rail structure, visibility, spacing, active
  states, badges, tooltips, and keyboard-accessible controls.
- Zetro Desk supplies project state, counts, actions, and utility behavior.
- The normal Zetro sidebar owns project selection and the active history or task
  list. It no longer duplicates the three activity buttons.
- Developer Tools accepts controlled open state so its floating indicator and
  utility-rail action operate the same repository panel.

## Interface review

- Spacing: Both 56px rails use the shared compact rhythm; the project list keeps
  the recovered space from the removed tab row.
- Typography: Rails remain icon-only and expose readable tooltip labels.
- Contrast: Shared active and badge tokens preserve light and dark themes.
- Alignment: Both rails use the shared fixed icon lane.
- Fit: The center canvas remains flexible and keeps its existing overflow rules.
- Repetition: Project activity controls exist only in the Primary Activity Rail.

## Verification

- `npm.cmd run typecheck --workspace @codexsun/zetro-web`: Passed.
- `npm.cmd run lint --workspace @codexsun/zetro-web`: Passed.
- `npm.cmd run build --workspace @codexsun/zetro-web`: Passed at 366.30 KB.
- Shared UI package type-check, lint, and build: Passed.
- `npm.cmd run test:zetro`: Passed.
- Browser: Verified rail order, Tasks navigation, Repository tools controlled
  opening, active states, and no warning or error logs.
- `npm.cmd run desktop:zetro:msi`: Passed.
- Zetro desktop type-check, lint, and Rust tests: Passed; 2 tests passed.
- MSI: `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.15_x64_en-US.msi`.
- MSI size: 45,809,664 bytes.
- MSI SHA-256: `F958C27D400E23265890B6C6EF01B52A995EDA30F31E5239A5142E5DB631CD72`.
- Executable SHA-256: `3AACC194885FB5AD0D8EAC0A23222C8541AA2D7E293A62FA0BFEEC1AF478B292`.
- MSI and executable product versions: `0.1.15`.
- MSI and executable Authenticode signatures: Not signed.
- Installation and upgrade over an earlier Zetro release: Not run.
- `npm.cmd run check:ui-system`: Passed after the concurrent UI ownership work completed.
- Full repository formatting: Not passed because two unrelated Orship files remain
  unformatted; the Zetro rail files and this record were formatted directly.
