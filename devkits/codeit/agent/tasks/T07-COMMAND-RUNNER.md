# T07: Command runner and process lifecycle

Status: planned. Prerequisites: T04, T05, and the accepted T00 command isolation proof. Owner: runner worker.

## Scope

Implement bounded test/build execution, process-tree tracking, streamed output, timeouts, cancellation, and resource accounting.
Use validated executable/argument/cwd contracts and the accepted OS boundary.
Treat package scripts and child processes as execution, not harmless command prefixes.

## Allowed paths

Lease workspace command/process files such as `workspace.command.*`, frontend command-output files, and runner tests.
T06 owns patch files. Shared exports and registration remain with the integrator.
Do not introduce an unrestricted terminal as a shortcut.

## Acceptance

- A permitted fixture test runs and records actual output, exit code, duration, and revision.
- Secret environment access, filesystem escape, child-process escape, and unapproved network use are blocked by enforced limits.
- Timeout/cancel stops only the owned process tree and fences queued actions.
- Output quotas, truncation artifacts, terminal errors, and interrupted recovery are accurate.

## Verification and handoff

Run real process-tree and adversarial isolation tests on target Windows hosts.
Cover E09/E10/E15/E16/E21 and command evidence in E22.
Return supported host boundary, negative test proof, process lifecycle artifacts, and templates/HANDOFF.md.
If isolation fails, keep Work unavailable and return a blocker rather than a permissive fallback.
