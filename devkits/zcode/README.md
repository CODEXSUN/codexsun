# Zcode Workspace Demo

Zcode is a local proof of one shared working environment. The editor and Node
container mount the same persistent Docker workspace volume. On first start,
a prepare container clones `https://github.com/CODEXSUN/codexsun.git` into
`/home/workspace/codexsun` inside that volume. The editor runs `npm ci` and
opens the checkout. A Docker volume keeps Git and npm writes on Linux storage.
The editor image includes Node, npm,
and the OpenAI Codex CLI and IDE extension. Sign in to Codex from the editor
using your own account. The dedicated local editor disables the workspace trust
prompt for this checkout; it is not an access-control boundary. No other
application or devkit is connected.

Start from the repository root:

```sh
sh devkits/zcode/.container/zcode-setup.sh
```

In Windows PowerShell with Git for Windows, use:

```powershell
& "C:\Program Files\Git\bin\bash.exe" devkits/zcode/.container/zcode-setup.sh
```

Open http://127.0.0.1:6132/?folder=/home/workspace/codexsun after the clone
and npm install finish. Create a
file in the browser editor, then confirm that the Node container can see it:

```sh
docker compose --env-file devkits/zcode/.container/.env -f devkits/zcode/.container/docker-compose.yml exec workspace node -e "console.log(require('fs').readdirSync('/workspace/codexsun'))"
```

Use `zcode-update.sh` to rebuild both images. Use
`zcode-drop.sh` to stop and remove this stack's containers and network. Neither
script removes the workspace or editor settings volumes. Startup never pulls
over local changes. It reruns `npm ci` only when `package-lock.json` changes or
`node_modules` is missing. Copy `.env.example` to `.env` to change the local
project name or browser port. Follow startup with
`docker compose --env-file devkits/zcode/.container/.env -f devkits/zcode/.container/docker-compose.yml logs -f editor`.

This demo has no authentication. Its editor port binds only to localhost. Do
not expose it to a network. Zuno authentication, CXForge, and per-developer
stacks are not connected yet. The editor terminal and Codex run in the editor
container, not the Node container. Nginx is unnecessary for this local proof.
