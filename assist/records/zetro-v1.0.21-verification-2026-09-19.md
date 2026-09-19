# Zetro v1.0.21 Verification Record

Date: 2026-09-19

Environment: Windows local development. Zetro API uses `127.0.0.1:6130`.
Zetro web uses `127.0.0.1:6131`.

## Release

- Commit: `e6ebd5e #21 - Zetro agent chat and workspace alignment`.
- Remote: `origin/main` contains the same commit.
- Version: `1.0.21`.

## Static and Module Checks

| Command | Result |
| --- | --- |
| `npm.cmd run test:app-architecture` | Passed. Two tests passed. |
| `npm.cmd --workspace @codexsun/zetro-api run check` | Passed. |
| `npm.cmd --workspace @codexsun/zetro-api run lint` | Passed. |
| `npm.cmd --workspace @codexsun/zetro-api run test` | Passed. Seven tests passed. |
| `npm.cmd --workspace @codexsun/zetro-web run check` | Passed. |
| `npm.cmd --workspace @codexsun/zetro-web run lint` | Passed. |
| `npm.cmd --workspace @codexsun/zetro-web run test` | Passed. Two tests passed. |
| `git diff --check` | Passed. |

## Live Checks

- Restarted Zetro API through `npm.cmd run dev:zetro-api`.
- `GET /api/zetro/v1/health` returned `ok`.
- `GET /api/zetro/v1/chat/runtime` returned `connected: true`, provider
  `Codex`, model `gpt-5.6-terra`, and reasoning `Medium`.
- Browser verification at `http://127.0.0.1:6131/` showed the connected state,
  the same model, and the same reasoning value.

## Limits

- This local Zetro host is intentionally loopback-only because it controls the
  local Codex CLI.
- Docker and production checks did not run. No deployment was requested.
- The final brief and persistent handover records remain Z-1205 work.
