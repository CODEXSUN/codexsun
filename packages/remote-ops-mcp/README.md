# Remote Operations MCP

`@codexsun/remote-ops-mcp` is the shared stdio MCP server for controlled repository and cloud operations. It is reusable by Zuno, Code Server, and other clients without coupling the server to a business application.

The process requires `CODEXSUN_MCP_API_TOKEN`. Keep this value in the host environment or a secret manager. Do not place it in a checked-in MCP JSON file. SSH hosts and commands are also configured by environment JSON, and requests can run only exact allowlisted commands.

## Client configuration

Use the supplied [`codexsun-mcp.example.json`](./codexsun-mcp.example.json) as a client fragment:

```json
{
  "mcp": {
    "servers": {
      "codexsun-remote-ops": {
        "command": "node",
        "args": ["packages/remote-ops-mcp/src/server.mjs"]
      }
    }
  }
}
```

Set `CODEXSUN_MCP_API_TOKEN` in the environment inherited by the MCP client. Set `CODEXSUN_MCP_REQUIRE_REQUEST_TOKEN=1` when a bridge also supplies a bearer token in MCP request metadata; local stdio clients can use process authentication with the default `0`.

## SSH configuration

```text
CODEXSUN_MCP_SSH_TARGETS={"logicx":{"host":"logicx.ignorelist.com","user":"YOUR_LOGIN_USER","port":2122,"keyPath":"E:/codexsun/codexsun/storage/runtime/ssh/logicx_ed25519"}}
CODEXSUN_MCP_SSH_ALLOWED_COMMANDS={"logicx":["docker compose ps","git status"]}
```

The key path, host, user, and command policy are server-side configuration. No request may choose a different key or arbitrary shell command. Every call is appended to `CODEXSUN_MCP_AUDIT_PATH` (default `storage/runtime/remote-mcp-audit.jsonl`).

Generate and install a dedicated key pair with the repository helper. The install step prompts for the server password interactively and does not save it:

```powershell
npm run mcp:ssh:keygen -- generate logicx
npm run mcp:ssh:keygen -- install logicx --user YOUR_LOGIN_USER --host logicx.ignorelist.com --port 2122
```

The provider then uses OpenSSH key authentication with `BatchMode=yes`; it does not store or transmit a login password. A manual connectivity check is:

```text
ssh -p 2122 YOUR_LOGIN_USER@logicx.ignorelist.com
```

Do not put the server password in `.env`, MCP JSON, or an app manifest. Password automation needs a separately reviewed secrets adapter and is intentionally not enabled by this package.

Tools are `registry.list`, `registry.verify`, `runtime.status`, `cloud.ssh.status`, and `cloud.ssh.exec`. This package does not own deployment policy or business data; those remain in the owning app or Zuno service.
