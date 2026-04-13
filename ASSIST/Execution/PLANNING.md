# Planning

## Active Batch

- `#158` Refresh ASSIST guidance context from README
  - Scope: explicitly reload the repository ASSIST guidance baseline from `ASSIST/README.md` and record that refresh in the active execution tracker.
  - Constraint: keep the change limited to execution tracking only; no product or runtime behavior should change from this batch.
  - Phase 1: read `ASSIST/README.md`. Completed.
  - Phase 2: log the guidance refresh in execution tracking. Completed.
- `#157` Add remote one-way git control API and CLI
  - Scope: add a framework-owned remote control engine that exposes a shared-secret protected one-way git update endpoint, an internal proxy route by saved live-server target, and a CLI helper for direct remote status and update calls.
  - Constraint: keep the deployment model strictly one-way; remote callers may trigger status reads and git update or reset-to-remote behavior only, but they must not gain any commit, branch mutation, or push capability.
  - Assumption: `runSystemUpdate` remains the single update engine, while remote control adds only a dirty-worktree guard that requires explicit `overrideDirty=true` before local drift is discarded.
  - Phase 1: inspect the current framework git-update service, external server-status route, and CLI command surfaces. Completed.
  - Phase 2: add a shared-secret protected remote git-update API, internal target proxy route, and CLI helper with dirty-override guard. Completed.
  - Phase 3: validate typecheck and focused framework plus route tests. Completed.
- `#156` Add version and git metadata to live server status
  - Scope: enrich the remote live-server snapshot with app version and git metadata from the remote runtime so operators can see version, git cleanliness, and the latest update message or timestamp directly in the detail view.
  - Constraint: derive the data from the existing framework system-update status source instead of introducing a second git inspection flow for remote monitoring.
  - Assumption: the remote status payload can safely reuse `currentRevision` and `isClean` from `getSystemUpdateStatus` to represent the latest deployed revision and current repository state.
  - Phase 1: inspect the remote server snapshot contract and framework git status source. Completed.
  - Phase 2: expose app version, git status, latest update message, and latest update timestamp from the remote runtime and render them on the server detail page. Completed.
  - Phase 3: validate typecheck and focused remote-server service tests. Completed.
- `#155` Make remote key generator persist and read from runtime .env
  - Scope: change the framework remote key generator so generating a server monitor secret writes `SERVER_MONITOR_SHARED_SECRET` into the current runtime `.env` and the page displays the saved env value instead of a transient frontend-only value.
  - Constraint: keep `.env` as the single source of truth for the local runtime secret; the frontend must read back through env-backed settings after generation rather than trusting a temporary in-memory secret alone.
  - Assumption: the existing `saveRuntimeSettings` service can safely update only `SERVER_MONITOR_SHARED_SECRET` when supplied with the current snapshot values and `restart: false`.
  - Phase 1: inspect the current remote key generator page and the env-backed runtime settings save path. Completed.
  - Phase 2: make the key generator write `SERVER_MONITOR_SHARED_SECRET` into `.env` and then display the saved env value. Completed.
  - Phase 3: validate typecheck and focused runtime-settings coverage. Completed.
- `#154` Split live server key generation from server target monitoring
  - Scope: move remote monitor key generation into its own super-admin page and keep the live-server list, show page, and upsert flow focused on saving the pasted `SERVER_MONITOR_SHARED_SECRET` value that already exists on the remote server.
  - Constraint: preserve isolated per-target secret confirmation; the monitor dashboard should no longer generate target secrets directly, and the generator page must not persist a secret to any saved target automatically.
  - Assumption: a lightweight framework internal route can return a one-time generated secret without introducing new persistence because the saved target still owns the confirmed secret copy.
  - Phase 1: inspect live-server target create or edit flow, framework route surface, and sidebar wiring for the new generator page. Completed.
  - Phase 2: move key generation into a dedicated page and make live-server create or edit accept only pasted remote `SERVER_MONITOR_SHARED_SECRET` values. Completed.
  - Phase 3: validate typecheck plus focused remote-server service and route-registry tests. Completed.
- `#153` Add edit and one-time secret flows to live server monitoring
  - Scope: let super admins edit saved live-server targets, paste a per-server remote monitor secret manually, and reveal generated secrets only once through the live-server workspace.
  - Constraint: keep saved per-server secrets isolated in framework-owned storage; normal target reads must stay redacted so the UI never displays the stored secret after the one-time reveal flow closes.
  - Assumption: the existing `PATCH /internal/v1/framework/remote-server` and `POST /internal/v1/framework/remote-server/generate-secret` routes already provide the required backend behavior, so this batch should stay UI-led with only small contract cleanup if needed.
  - Phase 1: inspect the current live server list, detail page, and per-target remote secret API surface. Completed.
  - Phase 2: add edit-server UI, manual secret input, and one-time generated-secret reveal dialogs without exposing saved secrets on normal reads. Completed.
  - Phase 3: validate typecheck and focused remote-server tests. Completed.
- `#152` Remove sidebar app-menu hover border treatment
  - Scope: remove the visible outer border color change on hover from the shared dashboard app side menu header while preserving the rest of the existing hover styling.
  - Constraint: patch the shared UI layer only so every dashboard surface gets the same behavior without app-specific overrides.
  - Assumption: the visible hover border comes from the sidebar brand-logo frame in `apps/ui`, not from the main navigation item buttons.
  - Phase 1: inspect the shared sidebar and app-menu header hover styling to isolate the visible outer border source. Completed.
  - Phase 2: remove the hover-only border treatment from the sidebar app-menu header without changing the rest of the hover behavior. Completed.
  - Phase 3: validate the shared UI change with typecheck. Completed.
- `#151` Add hosted-app status API, CLI, and dashboard operations page
  - Scope: expose live Docker-managed hosted app status through framework-owned API and CLI surfaces, plus add a suite-facing admin page with a clean software update action.
  - Constraint: keep orchestration in `apps/framework`; the browser must use only the internal API and the CLI must call the same service layer instead of duplicating Docker or update logic.
  - Assumption: hosted client app metadata can be derived from `.container/clients/*/client.conf.sh`, while live runtime state comes from Docker inspection plus each app's `/health` endpoint.
  - Note: the clean software update action should reuse framework-owned update behavior, selecting git-sync update when available and otherwise using the existing force-clean-rebuild path.
  - Phase 1: inspect existing framework update, route, CLI, and dashboard shell boundaries. Completed.
  - Phase 2: add a framework-owned hosted-app operations service plus internal API and CLI entry points. Completed.
  - Phase 3: add the admin dashboard page, route, settings launcher entry, and permission metadata for hosted app status. Completed.
  - Phase 4: validate typecheck, focused framework tests, route coverage, and production build. Completed.


clean task and planning and create new plan for sync from apps/frappe to core/product and also add manual query like
1. want custom filter item_group = laptop https://erp1.techmedia.in/desk/item?disabled=0&item_group=Laptop
2. add sync to ecommerce product button to sync product details into our core/product with all required fields
3. frappe items data and our system product data may different so create frappe mapping for our product and set default page with left right compare and also set default if needed
4. after update set badge inecommerce
5. 


