# Zetro

Zetro is the CODEXSUN idea workspace. It helps a person explore, revise, and
finish an idea before a later governed delivery workflow.

Zetro owns idea chat, final briefs, prepared handoff records, and delivery
receipts from Zuno. It does not own executable task validation, worker dispatch,
worktrees, product business logic, or approval records. It must not run
arbitrary unsandboxed commands or import private files from another application.

Zetro stores conversations in its private SQLite database. It uses the shared
storage provider for temporary attachments. Future data modules must own their
migrations, repositories, backup notes, and tests.

## Configuration

Copy `api/.app.env.example` and `web/.app.env.example` to ignored `.app.env`
files. Zetro uses API port 6130 and web port 6131 by default. The local SQLite
file is private under `storage/apps/private/zetro/runtime/zetro.sqlite`.

## Verification

Run `npm.cmd run test:zetro-api`, `npm.cmd run test:zetro-web`,
`npm.cmd run preflight:zetro-api`, and `npm.cmd run preflight:zetro-web`.

## Container development

Run `docker compose -f .container/docker-compose.yml up --build` from this
directory. The API and web services bind to `127.0.0.1:6130` and
`127.0.0.1:6131` by default, and Zetro's SQLite database is retained in the
`zetro-storage` Docker volume. Use the `ZETRO_*_BIND_ADDRESS` variables only
when a non-loopback host binding is intended.

Run `.container/zetro-setup.sh` to create the shared `codexsun-network` when
needed, build, start, and health-check Zetro. Use `.container/zetro-update.sh`
for an image rebuild and service recreation. `.container/zetro-drop.sh` stops
and removes the services while retaining data; pass `--purge` to remove the
SQLite volume as well.

The container configuration permits the API to listen on its container network
only through `ZETRO_CONTAINER_RUNTIME=1`; the published host ports remain
loopback-bound by default. Configure `ZETRO_ZUNO_API_URL` and
`ZETRO_ZUNO_CLIENT_KEY` for Zuno-dependent work.

Read [agent skills](agent/SKILLS.md) before work. Read
[Zetro planning](../../assist/execution/devkits/zetro/planning.md) and
[Zetro task register](../../assist/execution/devkits/zetro/task.md) before an agent
plans or starts Zetro work.
