# Mail: workflow

## Supported sequence

1. Configure company-scoped mail settings and verify the provider.
2. Read mailbox state or compose a draft with permitted attachments.
3. Queue delivery; inspect sent/failure state and retry safely.
4. Synchronise incoming messages through module workers and preserve mail history.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
