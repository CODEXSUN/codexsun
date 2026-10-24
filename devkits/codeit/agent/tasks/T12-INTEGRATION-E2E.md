# T12: Integration and complete E2E

Status: planned. Prerequisites: T09, T10, T11. Owner: integrator and independent reviewer.

## Scope

Integrate the product, settings, tool/plugin/personalization surfaces, and complete E2E suite.
Verify the optional Platform launcher and Tenant Apps path without coupling Codeit runtime startup to Platform.
Keep local-only and tenant behavior explicit. Tenant data access needs its separately accepted identity contract.
Register root test scripts and update owner developer references during authorized implementation.

## Allowed paths

The integrator leases Codeit composition, relevant Platform launch files, root test scripts, and E2E runner wiring.
Read all affected component documents first.
Do not repair unrelated application behavior without a new assignment.

## Acceptance

- The golden path and applicable E01–E25 scenarios pass on the combined revision.
- Real browser behavior, durable storage, denied access, recovery, and live provider evidence are distinct and complete.
- Cross-IDE manual dispatch/handoff succeeds with the same contract and isolated leases.
- The reviewer closes findings or records concrete blockers without weakening tests.

## Verification and handoff

Run owner/API/web checks, affected Platform checks, Docs/component checks, dependency checks, and the complete E2E suite.
Record unrelated baseline failures and included/excluded features explicitly.
Return templates/EVIDENCE.md for every applicable E-ID and the reviewed integrated revision.
Do not equate a mocked UI or successful build with product readiness.
