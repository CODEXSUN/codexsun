# Worker handoff template

## Identity and result

Record task ID, worker, IDE/version, contract revision, base revision, resulting revision or patch hash, and lease generation.
State completed behavior and remaining work without claiming broader integration.

## Changes

List changed paths, their owner, and why each changed.
List required shared composition changes for the integrator.
Record retained partial changes and any conflict against the current baseline.

## Verification

For each check, include cwd, exact command or browser steps, fixture, exit code, actual result, and artifact reference.
Label passed, failed, skipped, blocked, and unverified checks explicitly.
Include applicable E2E IDs and current revision/fixture hashes.

## Risks and next action

Record schema compatibility, secret/grant effects, partial external effects, and rollback limits where applicable.
State the next required action and who owns it.
Do not include credentials, raw session tokens, or private IDE databases.
