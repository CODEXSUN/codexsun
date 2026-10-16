# Docs: workflow

## Supported sequence

1. Review app business meaning, module contracts and workflows in repository Markdown/MDX.
2. Generate/validate the catalog and provision the Docs migration and permission seeds.
3. Browse app groups, modules, search, source, code blocks and table of contents in Docs.
4. Apply a permitted tenant Markdown override with an expected revision; inspect its audit and restore repository content when needed.
5. Zetro retrieves current authorised tenant reference excerpts; Zuno uses repository-only developer evidence.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
