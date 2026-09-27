# CODEXSUN application CLI

`@codexsun/app-cli` manages the project registry. It is independent from Platform and Framework so applications remain composable.

Run it through the root scripts:

```powershell
npm run app:list
npm run app:verify
npm run app:create -- inventory --label "Inventory" --api-port 6200 --web-port 6201
npm run app:remove -- inventory
npm run app:sync
npm run app -- build docx
npm run app -- dev docx api --check
npm run app:disable -- zetro --profile development
npm run app:install -- zetro --profile development
```

Run `npm run app` without arguments for the interactive lifecycle prompt. The installed workspace binary is `codexsun-app`.

`app:create` adds API and web hosts, Zod route schemas, protected internal API
reference setup, module tests, manifests, a deployment provider selection, and
the generated MDI app catalog. It does not install external packages or start a
database.

## Fresh standalone applications

The standalone factory creates a new direct-child repository foundation without
business modules, registry entries, or references to another application:

```powershell
npm run app:create-standalone -- app -- crm --label CRM
npm run app:create-standalone -- app -- qcafe --label "Q Cafe"
```

The target must not already exist. The same function is available through the
guarded local API. Set `APP_FACTORY_TOKEN`, then run `npm run app-factory:api`.
Use `POST /api/v1/app-factory/applications` with a JSON body such as
`{"id":"crm","label":"CRM"}` and `Authorization: Bearer <token>`.
The API binds to loopback by default and never accepts a target outside the
direct child repository boundary.

`app:disable` changes only `core/registry/profiles/<profile>.json`. It never removes
application files, packages, or persisted data. An add-on must explicitly
declare `dataRetention: "retain"`.

`app:uninstall` removes a stopped generated application. It removes only the
selected `apps/<id>` directory and that application's generated registry,
profile, MDI, lockfile, Turbo, script, and local port bindings. `app:remove`
is an alias for this destructive operation.
