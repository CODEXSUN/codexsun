# Zetro2

Zetro2 is a planned private coding application owned by `devkits/zetro2/`.
Its web app lets an actor plan work, submit tasks, inspect changes, and verify previews.
The agent, customized editor, development workspace, and Zbrowser run inside a private Docker environment.

## Documentation

- [Architecture and source ownership](agent/architecture-notes.md)
- [Implementation plan](agent/planning.md)
- [Ordered task register](agent/task.md)
- [Automation and governance](agent/automation.md)
- [Memory Bank](agent/memory-bank.md)

Status: Phase 1 access foundation complete (identity, membership, authorization, audit).
ZVcode source is imported with recorded provenance (task 2.4), a pinned
container build definition exists under `.container/` (task 2.5), and Layer-1
product defaults/branding are applied (tasks 2.6–2.7); the full
compile and runtime integration remain pending (tasks 2.8–2.10).
The existing ZCode and Zetro applications remain separate.
The development bootstrap provides a web landing page and an API health
endpoint. It does not yet launch ZVcode or implement the planned product APIs.

## Development ports

| Service              | Port | Command from repository root            |
| -------------------- | ---- | --------------------------------------- |
| API                  | 6300 | `npm run dev:zetro2-api`                |
| Standalone web       | 6310 | `npm run dev:zetro2-web`                |
| Zbrowser web preview | 6155 | Codexsun OS → Zbrowser → Zetro2 → Start |

Copy `api/.app.env.example` and `web/.app.env.example` to the corresponding
`.app.env` files before using the root development commands. Run `npm install`
after updating the checkout to register the new workspaces.

The web app proxies `/api` to `VITE_ZETRO2_API_URL`, defaulting to
`http://127.0.0.1:6300`. The health endpoint is `/api/v1/zetro2/health`.
Orship also currently uses API port 6300: run only one of these APIs per host
network namespace, or explicitly configure a different port for one of them.
The preflight rejects a conflicting occupied/reserved port.

Zbrowser supplies Start, Open, and Stop through the application registry.
It starts only the web preview; start the API separately if needed. If the
API runs outside the Zbrowser container, set `VITE_ZETRO2_API_URL` in the web
environment to an address reachable from that container.

With `ZCODE_PREVIEW_URL_TEMPLATE=https://{port}.tmnext.in/`, Open uses
`https://6155.tmnext.in/`. Add this host to the authenticated HTTPS reverse
proxy, pointing to host port 6155 with WebSocket forwarding. DNS/TLS and
remote deployment are separate from the local bootstrap verification.
The Compose host port can be overridden with `ZCODE_ZETRO2_PREVIEW_PORT`.
Rebuild/recreate Zcode using `sh devkits/zcode/.container/zcode-update.sh`
after the updated checkout is available to the stack.
