# Zuno: workflow

## Supported sequence

1. Configure the authorised source checkout, logs and model provider.
2. Choose work mode and open a diagnostic conversation/case.
3. Read bounded source/log/watch evidence through named tools.
4. Search developer reference pages and cite the source path before proposing a change.
5. Review plans and controlled correction workflows; never infer deployed state from repository text.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
