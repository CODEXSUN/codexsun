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
