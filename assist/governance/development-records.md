# Development Records

## Rule

Update documentation after each module or feature change. Documentation is part of the change, not later cleanup.

The change is incomplete until its owner README and development record describe the result. Update the app catalog when composition or discovery changes.

## Required updates

For each feature or module change:

1. Update the owning module README.
2. Update `assist/modules/<app>.md` when composition, status, or versions change.
3. Add or update one record under `assist/records/<app>`.
4. Update an architecture reference when a shared contract or binding changes.
5. Update the relevant local skill when the preferred workflow changes.

Use [the development record template](../templates/development-record.md).

## Record content

Each record must state:

- What changed and why.
- The authoritative reference for each contract.
- What each changed component owns.
- The binding properties between modules, packages, routes, runtime services, and configuration.
- Parallel work boundaries and any concurrent files preserved.
- Decisions and rejected alternatives that affect later work.
- Commands and tests that ran.
- Checks that did not run and remaining work.

Do not copy full module documentation into a record. Link the owner document and explain only the development decision.

## Parallel work

Before parallel work starts, assign one source owner for each file and contract. Workstreams may share public contracts, but they must not edit each other's private module files.

When concurrent work changes an affected file, preserve it and adapt through its public binding. Record the integration decision in the development record.

## Completion gate

`npm.cmd run check:module-docs` requires every module README to contain a development-record section. The full root check runs this gate.

A passing heading check does not prove that notes are current. The developer and reviewer must compare the record with the code diff.
