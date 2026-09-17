# <Application> Task Register

Task prefix: `<PREFIX>`

Read `planning.md` before changing code.

## Active Execution

- [ ] <PREFIX>-0001: <Feature Name>
  - Phase: `<phase>`
  - Status: planned | approved | in progress | blocked | complete
  - Owner: `<module or composition root>`
  - Data impact: no | yes
  - Approval: required before worktree creation
  - Verification: `<required checks>`

## Status Rules

1. Add the idea and feature definition to `planning.md` first.
2. Review the plan and record explicit approval in this file.
3. Create a worktree only for an approved task ID.
4. Verify the worktree before code changes.
5. Mark a checkbox complete only after required checks pass.
6. Record completion evidence in the active changelog version.
