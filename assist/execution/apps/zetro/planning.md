# Zetro Agentic IDE Planning

## Identity

Application: Zetro

Task prefix: `Z`

## Goal

Build Zetro as a governed agentic IDE. It turns an approved task into a bounded, reviewable worktree attempt.

Zetro plans, creates tasks, selects an approved worker, verifies evidence, and prepares human-controlled merge or deployment decisions.

## Core Rules

- Zetro owns workflow state. A model provider does not own workflow state.
- Model output is untrusted until a named policy or human approves it.
- One worker attempt has one short task ID, worktree, base revision, and guidance snapshot.
- A worker cannot merge, push, release, deploy, alter secrets, or expand scope.
- Every state transition writes an audit record and correlation ID.
