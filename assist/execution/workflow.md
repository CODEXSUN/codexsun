# Delivery Workflow

## Plan

1. Read the relevant Assist guides and module documentation.
2. Inspect the working tree and current module boundaries.
3. Define one task scope, owner, acceptance criteria, and verification checks.
4. Create a decision record when the work changes a cross-module rule or public contract.

## Implement

1. Work in the owner module or a named composition root.
2. Use public contracts for cross-module communication.
3. Keep every authored file at 700 lines or fewer.
4. Update module and central documentation with the change.

## Verify

1. Run focused module tests and type checks.
2. Run lint, formatting, and boundary checks.
3. Run local live checks for affected targets.
4. Run Docker checks for affected deployable composition.
5. Report passed checks, failed checks, and untested paths.

## Handoff

1. Update the active changelog entry.
2. Record any deployment evidence or unresolved risk.
3. Preserve unrelated working-tree changes.
4. Do not create a release or version bump without an explicit request.
