# Release Batches and Restore Points

## Purpose

This process separates frequent agent commits from verified releases. It keeps
`main` recoverable and prevents an unreviewed dirty worktree from becoming a release.

## Terms

- A task branch is one isolated worktree and one branch for one task.
- A batch is a named integration branch that combines selected task branches.
- A checkpoint is an annotated Git tag and a matching release branch.
- A release is a checkpoint that passed its declared checks and deployment proof.

## Task work

1. Create a worktree from the selected release checkpoint.
2. Create a branch named `codex/<task-id>-<short-name>`.
3. Commit small complete changes on the task branch.
4. Push the task branch when its owner wants remote recovery.
5. Do not merge a task branch directly into `main`.

## Batch work

1. Create `release/<version>-batch` from `main`.
2. Merge only selected clean task branches.
3. Record each source branch, commit, changed file, and owner.
4. Run the declared release checks on the batch branch.
5. Stop when any check fails or the batch has unreviewed changes.
6. Do not version, tag, merge, or push a failed batch.

## Release work

1. Update the repository version and changelog on the batch branch.
2. Re-run version checks and all declared release checks.
3. Merge the verified batch into `main` with a merge commit.
4. Create annotated tag `v-<version>` at the merge commit.
5. Create or move `release/v<version>` to the same commit.
6. Push `main`, the tag, and the release branch together.
7. Record artifact hashes, deployment target, and deployment result.

## Restore work

1. Select the latest checkpoint with successful deployment evidence.
2. Deploy that tag to restore the running application.
3. Create a new correction branch from `main`.
4. Revert the faulty release or make a corrective release commit.
5. Run the release gate again before deployment.

Never reset, force-push, or rewrite shared `main` to restore a release. Git history
must show the release and its correction.

## Automation rules

- Zetro must reject a release when the reviewed HEAD or file list changes.
- Zetro must reject a release from a dirty main worktree.
- Zetro must create tags only after the release gate passes.
- Zetro must use an explicit confirmation before a merge, tag, push, or deployment.
- Zetro must keep worktree cleanup separate from release cleanup.
