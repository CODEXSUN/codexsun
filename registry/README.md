# Application registry

This registry is the project-level catalog for installed applications, add-ons, and deployment profiles.

- `applications/*.json` declares an application and its supported hosts.
- `addons/*.json` declares an installable extension. Add-on data is retained when it is disabled.
- `profiles/*.json` selects enabled applications and add-ons for an environment.

Each file uses `schemaVersion: 1`. A profile can also select the provider IDs
for each enabled API application. The runtime rejects a provider that is not
available in that application.

The registry owns composition metadata only. Application source remains under its manifest `owner` path: platform and business apps use `apps/<application>`, while developer tooling uses `apps/devkits/<application>`. Reusable contracts remain in `packages`.

Use these commands:

```powershell
npm run app:create -- inventory --label "Inventory" --api-port 6200 --web-port 6201
npm run addon:create -- catalog --label "Catalog"
npm run app:sync
npm run app:verify
npm run app:uninstall -- <id>
npm run app:remove -- <id>
```

`app:create` adds an API and web foundation, typed route schema, protected API
reference, MDI entry, module tests, and deployment profile selection.

`app:disable` disables an application in the selected deployment profile. It
preserves application files and data. `app:uninstall` removes a stopped,
generated application from `apps/` and removes its registry, profile, MDI,
lockfile, Turbo, script, and local development port bindings. `app:remove` is
an alias for this destructive operation.
