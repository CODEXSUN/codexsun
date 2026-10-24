# Development and repair loop

Status: instructions for later authorized implementation. No implementation loop runs during this planning request.

## Prepare

1. Read the user request, repository rules, plan, task ledger, and assigned packet.
2. Confirm the project root, base revision, dirty baseline, contract version, and file lease.
3. Check prerequisite packet evidence. Reject missing or stale dependencies.
4. Record expected behavior and failure cases before editing.
5. Select the smallest tests that prove the behavior.
6. Confirm required tools, grants, and isolation. Record unavailable capabilities as blockers.

The supervisor records required shared composition changes before workers start.
A worker does not silently edit files outside its lease to fix compilation.

## Write and verify

1. Reproduce the issue or failing acceptance case in a disposable fixture.
2. Implement one coherent behavior in its owner.
3. Format affected files and run focused lint and typecheck.
4. Run unit and contract tests for the changed behavior.
5. Inspect the diff for boundary violations, secret exposure, and unintended changes.
6. Run integration and browser checks required by the packet.
7. Ask the reviewer to inspect the exact diff and evidence.
8. Repair findings and rerun affected checks.
9. Return a handoff with actual results and remaining limitations.

Do not use test skips, permissive casts, disabled authorization, or fake success rows to reach a green result.
Deterministic provider fixtures prove contracts. A real provider smoke run proves the selected live adapter separately.

## Root command gates

These commands exist for the current web shell. Run them from the repository root when relevant.

```text
npm exec prettier -- --check devkits/codeit
npm run lint -w @codexsun/codeit
npm run typecheck -w @codexsun/codeit
npm run build:codeit
node tools/check-module-boundaries.mjs codeit
npm run check:component-docs
npm run test:component-docs
npm run dependencies:check
```

The integrator adds API and E2E scripts during implementation, after selecting their real packages and test runners.
Do not report proposed commands as existing scripts.
The proposed `test:codeit:unit`, `test:codeit:integration`, `test:codeit:e2e`, and `test:codeit:provider-smoke` names need root registration.
The proposed API package needs its own lint, typecheck, and build scripts before API delivery is accepted.
Use the root frontend/backend verification gates once those packages exist.

Run `npm run docs:sync` and `npm run docs:check` only when implementation changes require repository reference updates.
The current planning request restricts edits to the agent folder, so it does not run a source-writing Docs sync.

## Diagnose a failure

Classify the failure as introduced defect, baseline defect, environment issue, contract drift, or unavailable external dependency.
Record exact reproduction and evidence. Preserve the failing output before changing inputs.
Fix the cause within scope, then rerun the smallest relevant gate.
Broaden testing only for changed dependencies, new failures, or unresolved risk.
After two failed attempts at the same repair, require a revised diagnosis before another attempt.
The default worker repair budget is three attempts per issue, subject to the assignment limit.
If the limit is reached, return a blocker with evidence and preserve partial changes.
Never reinterpret a missing result as a passed check.

## Integrate

The integrator checks leases, current file hashes, and the incoming diff before applying it.
After integration, rerun affected unit, contract, typecheck, lint, boundary, and build gates.
Run the relevant E2E scenarios on the integrated revision.
Dependency and shared-foundation changes require the root impact analysis and affected consumer checks.
Do not rerun a costly whole-repository suite without a relevant requirement or risk.
Existing unrelated failures remain explicit blockers to a full release claim.

## Interrupt and resume

Persist a checkpoint with task state, accepted scope, current revision, changed paths, grants, pending approvals, and last event cursor.
On resume, refresh source instructions, trust, leases, grants, provider availability, and relevant input hashes.
Do not blindly replay an interrupted command or external write.
Classify partial effects and reconcile them before retrying.
New user instructions steer the existing objective unless they explicitly replace it.

## Definition of done

The behavior works in its owner and in the integrated app.
Relevant positive and denied-access tests pass on the recorded revision.
Independent review is complete. Documentation, migrations, and rollback limits are accurate.
The result states what changed, how it was tested, and what remains unverified.
Release, deployment, or account actions need their own actual authorization.
