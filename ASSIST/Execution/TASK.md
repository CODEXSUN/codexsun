# Task

## Active Batch

- [x] `#158` Refresh ASSIST guidance context from README
  - [x] Phase 1: read `ASSIST/README.md`
  - [x] Phase 2: log the guidance refresh in execution tracking
- [x] `#157` Add remote one-way git control API and CLI
  - [x] Phase 1: inspect the current framework git-update service, external server-status route, and CLI command surfaces
  - [x] Phase 2: add a shared-secret protected remote git-update API, internal target proxy route, and CLI helper with dirty-override guard
  - [x] Phase 3: validate typecheck and focused framework plus route tests
- [x] `#156` Add version and git metadata to live server status
  - [x] Phase 1: inspect the remote server snapshot contract and framework git status source
  - [x] Phase 2: expose app version, git status, latest update message, and latest update timestamp from the remote runtime and render them on the server detail page
  - [x] Phase 3: validate typecheck and focused remote-server service tests
- [x] `#155` Make remote key generator persist and read from runtime .env
  - [x] Phase 1: inspect the current remote key generator page and the env-backed runtime settings save path
  - [x] Phase 2: make the key generator write `SERVER_MONITOR_SHARED_SECRET` into `.env` and then display the saved env value
  - [x] Phase 3: validate typecheck and focused runtime-settings coverage
- [x] `#154` Split live server key generation from server target monitoring
  - [x] Phase 1: inspect live-server target create or edit flow, framework route surface, and sidebar wiring for the new generator page
  - [x] Phase 2: move key generation into a dedicated page and make live-server create or edit accept only pasted remote `SERVER_MONITOR_SHARED_SECRET` values
  - [x] Phase 3: validate typecheck plus focused remote-server service and route-registry tests
- [x] `#153` Add edit and one-time secret flows to live server monitoring
  - [x] Phase 1: inspect the current live server list, detail page, and per-target remote secret API surface
  - [x] Phase 2: add edit-server UI, manual secret input, and one-time generated-secret reveal dialogs without exposing saved secrets on normal reads
  - [x] Phase 3: validate typecheck and focused remote-server tests
- [x] `#152` Remove sidebar app-menu hover border treatment
  - [x] Phase 1: inspect the shared sidebar and app-menu header hover styling to isolate the visible outer border source
  - [x] Phase 2: remove the hover-only border treatment from the sidebar app-menu header without changing the rest of the hover behavior
  - [x] Phase 3: validate the shared UI change with typecheck
- [x] `#151` Add hosted-app status API, CLI, and dashboard operations page
  - [x] Phase 1: inspect existing framework update, route, CLI, and dashboard shell boundaries
  - [x] Phase 2: add a framework-owned hosted-app operations service plus internal API and CLI entry points
  - [x] Phase 3: add the admin dashboard page, route, settings launcher entry, and permission metadata for hosted app status
  - [x] Phase 4: validate typecheck, focused framework tests, route coverage, and production build
