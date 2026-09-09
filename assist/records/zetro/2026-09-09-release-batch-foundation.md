# Zetro Release Batch Foundation

Date: 2026-09-09

## Outcome

The release-batch policy defines isolated task worktrees, integration batches,
immutable release checkpoints, and non-destructive restore behavior.

## Decision

Use an annotated tag and a matching release branch only after a batch passes its
declared checks. Restore a deployment from the previous verified tag. Correct
Git history through a new revert or correction release. Do not reset shared main.

## Next work

Add the policy as a guarded Git Delivery flow. It must preview branch and dirty
state, create a batch branch, record checkpoint evidence, and require explicit
confirmation before merge, tag, push, or deployment.
