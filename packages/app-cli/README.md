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

`app:disable` changes only `core/registry/profiles/<profile>.json`. It never removes
application files, packages, or persisted data. An add-on must explicitly
declare `dataRetention: "retain"`.

`app:uninstall` removes a stopped generated application. It removes only the
selected `apps/<id>` directory and that application's generated registry,
profile, MDI, lockfile, Turbo, script, and local port bindings. `app:remove`
is an alias for this destructive operation.
