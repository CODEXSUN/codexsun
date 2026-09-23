# Zcode Workspace Demo

Zcode is a local proof of one shared working environment. The editor and Node
container mount the same persistent Docker workspace volume. On first start,
a prepare container clones `https://github.com/CODEXSUN/codexsun.git` into
`/home/workspace/codexsun` inside that volume. The editor runs `npm ci` and
opens the checkout. A Docker volume keeps Git and npm writes on Linux storage.
On editor startup, `zcode-bootstrap.mjs` copies the root `.env.example` and
registered host `.app.env.example` files to ignored env files when missing.
It runs after `npm ci`, before OpenVSCode starts. It never replaces an existing
env file. New files use mode `0600`. The bootstrap selects local SQLite and
creates unique development secrets, API tokens, and account passwords. Read
the generated `.app.env` file in the editor to get a local account password.
No password or database credential is stored in the editor image.
The editor image includes Node, npm, and the Codexsun OS sidebar. Open its
Add-ons page to install Codex IDE or Codex CLI when needed. Neither Codex tool
is installed during the image build. Add-ons stay in the editor-home volume.
The editor is branded Codexsun Zcode and opens the workspace without the welcome
page. Existing editor settings are preserved; an explicit startup-editor choice
takes precedence over this default.
After installation, sign in to Codex from the editor using your own account.
Workspace Trust is disabled inside this dedicated local editor. It is not an
access-control boundary. Zuno and other application devkits are not connected.

Zbrowser runs in a separate container against the same persistent checkout.
Its Codexsun OS view groups registered web previews under **Apps** and
**Devkits**. UIUX starts with the stack at http://127.0.0.1:6133/; other web
targets start on demand. Select **Start**, wait for **Live**, then select
**Open**. Up to three previews can run together. Each target uses its own
localhost-only port (6140-6148 for the other current web targets). React edits
in Zcode refresh through Vite HMR. Set `ZCODE_ZBROWSER_PORT` in
`.container/.env` to change the UIUX port; avoid the reserved 6140-6148 range.
Zbrowser has no Docker socket or unrestricted shell endpoint. It starts only
registered web hosts. CXForge has an API host but no web host, so it is listed
without a preview. Other app API servers, databases, and credentials are not
started by Zbrowser; screens that require them may report API errors. SQLite
is the default, so no database server or database password is needed. To use
MariaDB, set `DB_DRIVER=mariadb` and valid `DB_*` values in the ignored root
`.env`, then provide a reachable MariaDB service separately. Inside a
container, `127.0.0.1` refers to that container, not the database service.
The bootstrap does not start APIs, run migrations, or seed data. The
preview ports bind to localhost only, so this is not an authenticated
multi-user gateway. The browser preview opens in a separate tab, not the
Simple Browser iframe, which cannot reach localhost from its CDN origin.

Start from the repository root:

```sh
sh devkits/zcode/.container/zcode-setup.sh
```

In Windows PowerShell with Git for Windows, use:

```powershell
& "C:\Program Files\Git\bin\bash.exe" devkits/zcode/.container/zcode-setup.sh
```

Open http://127.0.0.1:6132/ after the clone and npm install finish. The bare
URL selects `/home/workspace/codexsun` automatically. Create a file in the
browser editor, then confirm that
the Node container can see it:

```sh
docker compose --env-file devkits/zcode/.container/.env -f devkits/zcode/.container/docker-compose.yml exec workspace node -e "console.log(require('fs').readdirSync('/workspace/codexsun'))"
```

Use `zcode-update.sh` to rebuild both images. Use `zcode-drop.sh` to stop and
remove this stack's containers and network while keeping its data volumes.
Use `zcode-drop.sh --purge` only when you intend to remove the workspace,
editor settings, and Zcode-built images. Shared upstream base images remain.
Startup never pulls
over local changes. It reruns `npm ci` only when `package-lock.json` changes or
`node_modules` is missing. The stack's `.container/.env` controls its project
name and editor port. The checkout's root `.env` controls application runtime
settings. Follow startup with
`docker compose --env-file devkits/zcode/.container/.env -f devkits/zcode/.container/docker-compose.yml logs -f editor`.

This demo has no authentication. Its editor port binds only to localhost. Do
not expose it to a network. Zuno authentication, CXForge, and per-developer
stacks are not connected yet. The editor terminal and optional Codex tools run
in the editor container, not the Node container. Nginx is unnecessary for this
local proof.
