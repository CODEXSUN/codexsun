# Deployment Assembly Skill

## Use this when

Use this guide for `.container`, `packages/runtime`, a deployable application,
an add-on, a customer profile, a selected build, Docker, or a container change.

Also read [Server Runtime](server-runtime.md) when local process ownership changes.

## Before code

1. Read the root agent guide, deployment assembly standard, application standard, and extension standard.
2. Read `.container/README.md`, the target application README, and its latest development record.
3. Inspect `.container/catalog.json`, the affected profile, root scripts, and current Git status.
4. Preserve unrelated application and package work.

## Ownership test

- Application code owns its business and technical behavior.
- Framework and Platform Core own only stable shared contracts and adapters.
- `packages/runtime` owns selection validation and immutable deployment planning.
- `.container` owns catalogs, profiles, and reusable container templates.
- A profile selects existing owners. It never creates a customer-specific source fork.

## Implementation rules

- Register one component per API, web server, worker, desktop process, or mobile artifact.
- Declare application dependencies, component dependencies, runtime package ranges, ports, health paths, build workspaces, and root-dist outputs.
- Add every application to the complete `development` profile.
- Keep Orship out of `main-development` so the default local stack and its observer have separate process owners.
- Keep secrets out of JSON profiles. Use `environment.env` or a deployment secret manager.
- Keep one process per container and combine the selected services through one Compose project.
- Stage only selected component artifacts and required production dependencies.
- Bind an add-on only to named target components and a documented public extension point.
- Reject invalid selection before building or starting a process.
- Start local components through root preflight so each owned listener receives a marker under `storage/app/private/runtime/processes`.
- Set `windowsHide: true` for Windows helper processes so local startup does not flash console windows.
- On Windows, force-stop only a listener that preflight verified as repository-owned. Do not use a non-forced `taskkill` path because it can prompt the npm batch host for input.
- Capture readable and structured component output under `storage/app/private/runtime/logs` and warning or error records under `storage/app/private/runtime/failures`; do not introduce application-local log folders.
- Keep production JSON unchanged. Format local output only at the root preflight boundary.
- Keep Orship observation read-only for unowned listeners. A stop action requires a matching component, port, process ID, and repository root marker.
- Protect the Orship API and web components from self-stop. Keep remote control disabled until Identity authorization and a trusted control agent exist.

## Verification

1. Run `npm.cmd run runtime:validate`.
2. Run `npm.cmd run runtime:plan -- <profile>` and inspect resolved order, bindings, ports, and workspaces.
3. Run `npm.cmd run runtime:compose -- <profile>` and validate the generated Compose file.
4. Run `npm.cmd run runtime:build -- <profile>` for changed artifact logic.
5. Prove one complete profile and one omission profile.
6. Run `npm.cmd run test:runtime-holder`, the root documentation and layout gates, and `git diff --check`.
7. Record Docker engine, database, secret-manager, network, and live-server checks separately when unavailable.
8. For process-control changes, prove one owned stop/start cycle, confirm the new process ID, inspect its readable and failure logs, and verify protected components reject control.

## Documentation

Update the deployment standard or guide when the assembly contract changes. Update every affected application README, the Platform development record, and the changelog in the same patch.
