# Platform tasks

## Responsibility

The authenticated runtime, tenant routing, application composition, entitlements, permissions, queues, storage, administration, and Windows host.

Composition registers public app contracts. Business CRUD stays in each owner. Preserve Corporate ID resolution, signed session context, live authorization, and server-only secrets.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Platform source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### Application overview refresh, 16-10-2026

- The overview uses the current company, financial year, landing app, tenant name, and available app list.
- Application, Access Control, and Organisation shortcuts open their existing workspaces.
- Available apps and add-ons open their own workspaces. The obsolete fixed two-app count was removed.
- The overview uses light surfaces and responsive cards in a separate desk component.
- Platform web typecheck, lint, and Platform boundaries passed. Authenticated browser appearance remains unverified.
- No API, permission, or database contract changed.

### API startup migration imports, 16-10-2026

- Tenant runtime composition imports sibling migration files directly instead of loading module indexes with services and routes.
- This removes the startup cycle that accessed `tenantMigration` before initialization.
- `npm run dev:api` completed database bootstrap and started the API on port 7010.
- `/public/runtime-config` returned HTTP 200.
- Platform API typecheck, lint, Platform boundaries, component documentation checks, and dependency checks passed.
- Migration keys and database statements did not change. No database migration is required for this fix.

### Tenant Settings app cards, 16-10-2026

- New and edit Settings show all tenant apps from the registry. Admin-only developer tools remain excluded.
- Registry updates refresh the cards without replacing the current toggle choices.
- Application, CODEXSUN, and Billing appear first. Cards use a light background.
- Super Admin overview cards use the Settings icon, title, and description pattern. Each card still opens its own details.
- Formatting, lint, Platform boundaries, component documentation checks, and dependency checks passed.
- The build stopped at an unrelated Ecommerce Storefront Organisation type error for missing `displayName` and `logoFileName`.
- Authenticated browser verification remains pending. No database migration is required.

### Super Admin submenu list reset, 16-10-2026

- Sidebar navigation starts a new workspace instance, including repeated clicks on the active submenu.
- List workspaces return to their initial list instead of retaining an open detail or form.
- Navigation clears record search parameters and preserves the selected Zetro tenant context.
- Passed: Platform web typecheck, lint, and Platform boundary check.
- Authenticated browser verification remains pending. No database migration is required.

### Super Admin overview app catalog, 16-10-2026

- The overview keeps the Platform runtime card and adds database-backed app cards from `/admin/apps`.
- Application, CODEXSUN, and Billing appear first. Notes and Chat appear under Add-ons.
- Each app card opens its own details through `/sa/app-operations?app=<appId>`.
- Cards and details use the app color. Details show registry settings and shared Platform service health.
- Details do not grant tenant access or report independent service health.
- Passed: Platform web typecheck, lint, build, Platform boundary check, component documentation checks, and dependency layout check.
- Browser verification reached the Super Admin login screen after session expiration. Authenticated layout verification remains pending.
- No database migration is required.

- `node tools/check-module-boundaries.mjs platform`
- `npm run typecheck -w @codexsun/platform-api`
- `npm run lint -w @codexsun/platform-api`
- `npm run build -w @codexsun/platform-api`
- `npm run typecheck -w @codexsun/platform-web`
- `npm run lint -w @codexsun/platform-web`
- `npm run build -w @codexsun/platform-web`
- `npm run typecheck -w @codexsun/windows`
- `npm run lint -w @codexsun/windows`
- `npm run build -w @codexsun/windows`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.

## Billing compliance queue host, October 16, 2026

- Platform relays Sales and Export Sales tenant outboxes through Queue Manager. Payloads contain trusted registry database names and operation identifiers; invoice snapshots and credentials stay out of queue payloads.
- Dispatch validates the active registry tenant, database match, enabled owner module and current actor compliance permission. Billing owns provider submission, recovery, cancellation and invoice locks.
- Queue claims use conditional updates. Stale Billing queue jobs expire for owner reconciliation. API close stops the relay.
- Passed Platform API type check, lint and build, Platform boundaries, and the full Platform web build. Browser sandbox generation/cancellation exercised the database queue backend. Redis recovery remains unverified.
