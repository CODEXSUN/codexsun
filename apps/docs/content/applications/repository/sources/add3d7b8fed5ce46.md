# T06: Safe patches and change review

Repository source: `devkits/codeit/agent/tasks/T06-PATCH-REVIEW.md`

Source SHA-256 (LF line endings): `e0611d8490dc345b05ae6360ab49aba8b35c7cc487d06afe187cf110fdbe9451`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# T06: Safe patches and change review

Status: planned. Prerequisites: T04, T05, and the accepted T00 mutation isolation proof. Owner: patch worker.

## Scope

Implement exact patch proposals, expected content hashes, atomic writes, diff artifacts, conflict reporting, and review UI.
Bind patch approval to current project, action digest, policy, and relevant file hashes.
Preserve unrelated dirty changes and expose conflicts instead of overwriting them.

## Allowed paths

Lease workspace patch files such as `workspace.patch.*`, frontend patch-review files, and patch-specific tests.
T07 leases separate command files in the same owner. Neither worker edits shared workspace exports concurrently.
The integrator applies export and route registration requests.

## Acceptance

- An authorized exact patch changes only leased targets once.
- Stale hashes, expired approval, changed root, path escape, and cancelled generation reject application.
- Partial write failure preserves recoverable originals or a documented atomic failure result.
- Diff review identifies the exact before/after revisions and protected user changes.

## Verification and handoff

Run real-filesystem patch tests, conflict/idempotency tests, policy denials, and browser diff review.
Cover E08/E10/E11/E21/E22.
Return patch/diff artifacts, failure recovery evidence, changed-path proof, and templates/HANDOFF.md.
Keep mutation unavailable when the host cannot enforce its runner boundary.
```
