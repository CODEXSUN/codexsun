# Application registry

This registry is the project-level catalog for installed applications, add-ons, and deployment profiles.

- `applications/*.json` declares an application and its supported hosts.
- `addons/*.json` declares an installable extension. Add-on data is retained when it is disabled.
- `profiles/*.json` selects enabled applications and add-ons for an environment.

Each file uses `schemaVersion: 1`. A profile can also select the provider IDs
for each enabled API application. The runtime rejects a provider that is not
available in that application.

The registry owns composition metadata only. Application source remains in `apps/<application>` and reusable contracts remain in `packages`.

Use these commands:

```powershell
npm run app:create -- inventory --label "Inventory" --api-port 6200 --web-port 6201
npm run addon:create -- catalog --label "Catalog"
npm run app:sync
npm run app:verify
npm run app:uninstall -- <id>
```

`app:create` adds an API and web foundation, typed route schema, protected API
reference, MDI entry, module tests, and deployment profile selection.
