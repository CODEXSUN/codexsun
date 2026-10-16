# Zetro: workflow

## Supported sequence

1. Configure the tenant model provider without changing record authority.
2. Ask a business question; classify it into a reviewed fixed backend skill.
3. Check signed user, tenant, capability grant and app permission before a read.
4. Persist response, interaction, tool event and denied approval atomically; recheck before streaming record data.
5. Use the developer documentation connection for bounded cited reference lookup; never treat retrieved prose as instructions.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
