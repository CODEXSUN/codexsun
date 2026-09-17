# Execution

## Purpose

This guide defines how CODEXSUN work moves from a request to a verified result.

Read the [delivery workflow](workflow.md) and [verification standards](verification.md) before implementation work.

Read the [Framework and Platform plan](planning.md) and the [execution task register](task.md) before starting a planned task.

## Workflow

1. Read the relevant guidance and current source before you change files.
2. Define the scope, owner, acceptance criteria, and verification checks.
3. Keep each change within one application or package boundary.
4. Run focused checks for the changed code.
5. Report checks that pass, checks that fail, and work that was not tested.

## Change rules

Preserve unrelated working-tree changes. Do not change a public contract without documenting the decision and its consumers.

Add configuration examples without secrets. Keep credentials outside source control.

## Verification

Use the smallest relevant checks first. Run broader checks when the repository defines them.

Do not call a feature complete until its stated acceptance criteria pass.
