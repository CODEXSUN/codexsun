# T02: Local runtime, identity, and storage

Status: planned. Prerequisites: T00. Owner: runtime worker.

## Scope

Implement Codeit's own API host, local pairing/session boundary, metadata storage, migrations, artifact storage, and readiness.
Use the accepted embedded adapter and private storage root.
Implement real project registration/trust and artifact contracts in their owners.
Keep owner persistence available to later packets through intentional public contracts.

## Allowed paths

Lease `devkits/codeit/api` host/storage infrastructure, project and artifact leaves, and their tests.
Exact files must exclude provider, run, tool, plugin, and personalization implementation owned by later packets.
The integrator applies root workspace changes, API package exports, startup wiring, and Codeit proxy configuration.

## Acceptance

- The runtime starts without Platform and refuses occupied or invalid ports.
- Unapproved Host/Origin, missing identity, CSRF, and invalid event-stream access are denied.
- Pairing cannot be completed by arbitrary remote browser content.
- Fresh schema, retained-data upgrade, transactional storage, quotas, and crash-safe artifact handling work.
- Cookies cannot be confused with another localhost application's sessions.

## Verification and handoff

Run API lint/typecheck/build, storage integration, migration, pairing, and denial tests.
Cover E01/E02, project parts of E03, storage parts of E15/E21/E23.
Return bootstrap/restore steps, public persistence contracts, actual security evidence, and templates/HANDOFF.md.
Do not bind externally or weaken origin checks for convenience.
