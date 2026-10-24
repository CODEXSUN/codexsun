# T08: Single-worker coding loop

Status: planned. Prerequisites: T01, T04, T05, T06, T07. Owner: integrator.

## Scope

Join chat, plans, grants, provider tool proposals, workspace operations, diff review, tests, and evidence.
Implement the bounded reproduce/write/test/review/repair loop from DEVELOPMENT-LOOP.md.
Use one worker until the full golden path passes.
Keep model-produced plans separate from backend-controlled state and permissions.

## Allowed paths

The integrator leases composition and affected owner integration files explicitly.
Changes remain inside Codeit and legitimate shared transport/startup boundaries.
Do not absorb leaf business behavior into an app-level orchestrator.

## Acceptance

- The golden path reaches a real fixture code change and browser-visible result.
- A deliberate failing test is reproduced, repaired, and rerun with fresh evidence.
- User steering, cancellation, denied tools, conflict, provider failure, and restart remain recoverable.
- The final report matches the actual integrated diff and test outcomes.

## Verification and handoff

Run the one-worker golden path and applicable E01–E12/E15/E16/E20–E24 cases.
Run Codeit owner and affected consumer typecheck, lint, boundaries, build, and dependency checks.
Return the integrated revision, browser traces, live-provider smoke result, unresolved limits, and templates/EVIDENCE.md.
Do not start parallel implementation workers until this gate passes.
