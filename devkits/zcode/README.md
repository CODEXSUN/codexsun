# Zcode Workspace Demo

Zcode is a local proof of a working environment. The editor and Node
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
port bound to localhost by default (6140-6148 and 6155 for the other current web targets). React edits
in Zcode refresh through Vite HMR. Set `ZCODE_ZBROWSER_PORT` in
`.container/.env` to change the UIUX port; avoid reserved ports 6140-6148 and 6155.
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
not expose it to a network. Zuno authentication, CXForge, and managed
per-developer stacks are not connected yet. The editor terminal and optional
Codex tools run in the editor container, not the Node container. Nginx is
unnecessary for this local proof.

## Remote development previews

The API setting `PLATFORM_HOST=0.0.0.0` is a valid listening address. It does
not change preview links or publish Docker ports. Zbrowser already starts
Vite with `--host 0.0.0.0` inside its container.

For direct preview access over a trusted network, set these values in
`devkits/zcode/.container/.env` (or the selected `.env.<profile>`):

```dotenv
ZCODE_PREVIEW_BIND_HOST=0.0.0.0
ZCODE_PREVIEW_PUBLIC_HOST=192.0.2.10
ZCODE_PREVIEW_PUBLIC_SCHEME=http
```

Replace the example IP with the server IP or domain reachable from your
browser. A host must not include a protocol, path, or port. These settings
apply to UIUX and all registered web previews, preserving the configured host
port mappings. The public hostname is also allowed by Vite. Local defaults
remain `127.0.0.1` and `http`; a public address is not detected automatically.

From the repository root, rebuild and recreate the stack:

```sh
sh devkits/zcode/.container/zcode-update.sh
```

Pass the profile name to that command when using `.env.<profile>`. Reload
the editor after updating the extension. Allow only the required preview
ports through the server firewall; a WAN address behind a router also needs
port forwarding. The editor remains bound to localhost, and the Zbrowser
management API remains internal.

Open and the outlined API/Web/Zbrowser badges default to
`https://{port}.tmnext.in/` even when the editor receives no preview environment
variables. Set `codexsunOs.previewUrlTemplate` or `ZCODE_PREVIEW_URL_TEMPLATE`
to override this. For local access use `http://127.0.0.1:{port}/`; for direct
IP access use `http://YOUR_SERVER_IP:{port}/`. Do not use `0.0.0.0` in a browser
URL. URL settings do not change Docker bindings or Vite's allowed hosts.

Each outlined app card shows preview status and configured API, standalone
Web, and Zbrowser ports. API/Web badges open their configured domains but do
not start those services or claim they are live. The Zbrowser badge opens
only when the preview is ready. Missing ports show a disabled dash. Ports
are read from app environments (falling back to examples/registry defaults)
when the manager starts; restart the manager after changing them.

For internet access, put authentication and an HTTPS reverse proxy in front
of these unauthenticated previews. Keep Docker bound to loopback when the
proxy runs on the host. The proxy must support WebSockets for live reload.
The default domain URLs use HTTPS on port 443; the proxy routes each subdomain
to its corresponding service port. Do not publish the unauthenticated editor.

For port subdomains such as `https://6140.tmnext.in/`, use:

```dotenv
ZCODE_PREVIEW_BIND_HOST=127.0.0.1
ZCODE_PREVIEW_URL_TEMPLATE=https://{port}.tmnext.in/
ZCODE_PREVIEW_ALLOWED_HOST=.tmnext.in
```

The URL template overrides the public host and scheme. You can also set
`codexsunOs.previewUrlTemplate` in editor settings. Point wildcard DNS
`*.tmnext.in` to the proxy server and provide a matching TLS certificate.
Configure the authenticated proxy to route `6140.tmnext.in` to
`http://127.0.0.1:6140`, and likewise for the other configured preview ports
(including UIUX). Preserve the Host header and forward WebSocket upgrades.
Only permit configured preview ports in the proxy's subdomain routing.
Loopback upstreams assume the proxy runs on the Docker host; a proxy container
must reach Zbrowser via a shared Docker network and its internal ports.

CRM's `VITE_CRM_API_URL` is a server-side Vite proxy destination. Keep
`http://127.0.0.1:6204` only when CRM's API runs in the same network namespace
as Vite. For a separate API container, use its reachable service hostname and
internal port. Zbrowser starts web previews only; start the API separately.

## Separate local stacks

Preview port reservations are listed in
[preview-ports.json](.container/zbrowser/preview-ports.json). They are fixed
by application ID rather than registry sort order. UIUX uses
`ZCODE_ZBROWSER_PORT` (default 6133). Vite uses `--strictPort` so a busy port
causes startup to fail rather than silently changing the preview URL. These
are configuration reservations, not operating-system port locks while an app
is stopped. Adding a web app requires reserving and publishing another port.

| Application | Zbrowser port | Remote preview |
| --- | --- | --- |
| CRM | 6140 | https://6140.tmnext.in/ |
| HIMSX | 6141 | https://6141.tmnext.in/ |
| LMS | 6142 | https://6142.tmnext.in/ |
| Q Cafe | 6143 | https://6143.tmnext.in/ |
| Sites | 6144 | https://6144.tmnext.in/ |
| Docx | 6145 | https://6145.tmnext.in/ |
| Orship | 6146 | https://6146.tmnext.in/ |
| Zetro | 6147 | https://6147.tmnext.in/ |
| Zuno | 6148 | https://6148.tmnext.in/ |
| Zetro2 | 6155 | https://6155.tmnext.in/ |
| UIUX | 6133 | https://6133.tmnext.in/ |

These ports apply to Zbrowser development previews. Standalone app dev
commands use their own `.app.env` ports; application APIs are not started by
Zbrowser. CXForge has no registered web preview, and the core platform is not
part of the Zbrowser catalog. At most three previews run concurrently.

Standalone development ports observed in this checkout's `.app.env` files
are listed below. These are separate from Zbrowser's reserved ports and are
not changed by the preview configuration. CRM and Q Cafe have local port
overrides that differ from their registry defaults.

| Application | Standalone API | Standalone web | Registry API / web defaults |
| --- | --- | --- | --- |
| CRM | 6204 | 6205 | 6230 / 6231 |
| HIMSX | 6240 | 6241 | 6240 / 6241 |
| LMS | 6250 | 6251 | 6250 / 6251 |
| Q Cafe | 6202 | 6203 | 6220 / 6221 |
| Sites | 6260 | 6261 | 6260 / 6261 |
| Docx | 6200 | 6201 | 6200 / 6201 |
| Orship | 6300 | 6301 | 6300 / 6301 |
| Zetro | 6130 | 6131 | Not declared |
| Zuno | 6410 | 6411 | 6410 / 6411 |
| Zetro2 | 6300 | 6310 | 6300 / 6310 |
| UIUX | — | 6102 | Not declared |
| Core platform | 6100 | 6101 | Not declared |
| CXForge | Not set in app env | — | 6400 / — |

The standalone values live under each application's `api/.app.env` and
`web/.app.env`; registry defaults live in `core/registry/applications/`.
Platform desktop uses 6103. Zuno desktop/mobile use 6413/6414. Platform mobile
has no port configured. Desktop/mobile hosts are not browser preview targets.

Zcode can run more than one local Compose stack without sharing writable
volumes. Create an ignored `.container/.env.<profile>` from
`.container/.env.example`. Use a lowercase profile name such as `alice`,
set `ZCODE_PROJECT_NAME=zcode-alice`, and assign unique host ports for
`ZCODE_EDITOR_PORT`, `ZCODE_ZBROWSER_PORT`, and all nine
`ZCODE_PREVIEW_PORT_1` through `ZCODE_PREVIEW_PORT_9`, and
`ZCODE_ZETRO2_PREVIEW_PORT` (default 6155). For example, one
profile could use 6232, 6233, 6240-6248, and 6255. Keep every port distinct across
profiles. The default stack uses 6132, 6133, 6140-6148, and 6155.

Run `zcode-setup.sh alice`, `zcode-update.sh alice`, and
`zcode-drop.sh alice` from the repository root. Use
`zcode-drop.sh --purge alice` only to delete Alice's checkout and editor
settings. Each stack clones the same repository into its own volume; edits are
not shared. A profile is local isolation for testing, not user authentication
or a Zuno-managed workspace.
