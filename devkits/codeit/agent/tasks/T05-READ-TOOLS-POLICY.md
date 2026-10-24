# T05: Read tools and capability policy

Status: planned. Prerequisites: T02. Owner: workspace/policy worker.

## Scope

Implement typed tool definitions, invocation records, grants, approval binding, revocation, and read-only workspace tools.
Add canonical-root search/read, protected-file exclusions, Git inspection, and bounded diagnostics.
Use the frozen run contract for actor and assignment context. Integrate with T04 through public interfaces.

## Allowed paths

Lease API tool owner and workspace read/path/Git files, plus frontend tool inspection files and tests.
Reserve future workspace patch and command files for T06/T07.
The integrator owns shared exports and route composition.

## Acceptance

- Policy intersects identity, project trust, mode, grant, and backend ceilings.
- Plan/Ask/Review cannot invoke source mutations or commands.
- Traversal, junctions, symlinks, secret reads, oversized output, and cross-project access fail closed.
- Changed action digests and revoked grants invalidate pending approvals.
- Tool output cannot change policy or grant another capability.

## Verification and handoff

Run policy/path unit tests and real filesystem denial integration tests with synthetic canaries.
Cover E03/E04/E11/E12/E20/E21 and bounded output portions of E16.
Return tool catalog, error codes, invocation audit proof, attack cases, and templates/HANDOFF.md.
Do not enable mutation merely because read-only path checks pass.
