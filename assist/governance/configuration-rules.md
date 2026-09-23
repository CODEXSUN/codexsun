# Configuration Rules

## Configuration files

The repository uses two runtime configuration layers.

| File                  | Owner           | Use                                                                         |
| --------------------- | --------------- | --------------------------------------------------------------------------- |
| `.env`                | Repository root | Shared repository variables, infrastructure endpoints, and global defaults. |
| `apps/<app>/.app.env` | Application     | Application credentials, ports, URLs, and application-specific overrides.   |

Use `.env.example` and `apps/<app>/.app.env.example` for safe variable names and sample values. Never put live secrets in an example file.

## Required behavior

- Read every runtime value from `.env` or the owner app's `.app.env`.
- Do not hardcode credentials, ports, URLs, hostnames, feature flags, or deployment-specific values in source code.
- Validate loaded configuration with Zod before the application starts.
- The root `.env` provides shared defaults. An app `.app.env` provides only that application's overrides.
- Document every required variable in the owning application README.
- Keep `.env` and `.app.env` out of version control.

## Shared runtime contracts

`@codexsun/platform-core/runtime-config` owns the Zod schemas for API, web,
desktop, and mobile runtime values. Hosts load `.env` and `.app.env`, then pass
the environment to the correct reader before startup.

The API contract reads `NODE_ENV`, `PLATFORM_HOST`, `PLATFORM_API_PORT`, and
`DATABASE_URL`. The web contract reads only `PLATFORM_HOST`,
`PLATFORM_WEB_PORT`, and `VITE_PLATFORM_API_URL`. Desktop and mobile contracts
read their explicit API URLs.

The web contract removes unknown values. Do not pass server values into a
browser configuration object.

## Access boundaries

An application may read the root `.env` and its own `.app.env`. It must not read another application's `.app.env`.

Browser clients receive only explicitly safe public configuration. Server credentials, database URLs, queue URLs, and signing keys must remain server-side.

## Required checks

1. Check that required variables exist before startup.
2. Reject invalid ports, URLs, credentials, and storage paths at startup.
3. Search changed source for hardcoded configuration values.
4. Confirm `.env` and `.app.env` files remain ignored by Git.

## Shared MCP credentials

MCP API tokens, SSH keys, hosts, and command allowlists are runtime configuration. Keep them in a secret manager or process environment (`CODEXSUN_MCP_API_TOKEN`, `CODEXSUN_MCP_SSH_TARGETS`, and `CODEXSUN_MCP_SSH_ALLOWED_COMMANDS`); never commit them to client JSON, manifests, or application source. Use `@codexsun/remote-ops-mcp` for reusable remote operations and keep app-specific policy in the owning service.
