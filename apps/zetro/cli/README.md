# Zetro CLI

`@codexsun/zetro-cli` is the terminal client for deterministic Zetro automation. It calls the same HTTP contracts as the web and desktop interfaces. It does not duplicate Git commands, repository script execution, worktree cleanup, or task persistence.

Build and invoke it from the repository root:

```powershell
npm.cmd run zetro -- health
npm.cmd run zetro -- projects
npm.cmd run zetro -- scripts <project-id>
npm.cmd run zetro -- ui-audit <project-id>
npm.cmd run zetro -- run <project-id> test
npm.cmd run zetro -- tasks <project-id>
npm.cmd run zetro -- watch <run-id>
```

Set `ZETRO_API_URL` when the API does not use `http://127.0.0.1:6050`. A secured desktop API also requires `ZETRO_SESSION_TOKEN`. Keep this token in the process environment and do not save it in scripts or repository files.

Git push, commit, release execution, cleanup scripts, and worktree sweeps require `--confirm`.
Preview the repository or release state first.

## Desktop supervisor

The launcher starts a release desktop with a random token held only in process memory:

```powershell
node dist/apps/zetro/cli/main.js desktop-session dist/apps/zetro/desktop/target/release/zetro-desktop.exe
```

Close an existing Zetro desktop first. The launcher checks port 16050 and never stops another listener.
After its `ready` response, send one JSON command array per line, such as `["supervisor","projects"]`.
Use `["supervisor","submit","request.json","--confirm"]` for a reviewed job.
Use `["supervisor","connect","project.json","--confirm"]` to register a repository.
The project file contains `name` and an absolute `repositoryPath`.
Closing the desktop ends the session. Closing stdin leaves the desktop open.
Start a new session after closing the previous desktop to establish a new token.

Build the CLI once. Then call its root-dist artifact directly for repeated operations:

```powershell
node dist/apps/zetro/cli/main.js supervisor capabilities --api http://127.0.0.1:16050
node dist/apps/zetro/cli/main.js supervisor projects --api http://127.0.0.1:16050
node dist/apps/zetro/cli/main.js supervisor submit request.json --confirm --api http://127.0.0.1:16050
node dist/apps/zetro/cli/main.js supervisor jobs --api http://127.0.0.1:16050
node dist/apps/zetro/cli/main.js supervisor job <task-id> --api http://127.0.0.1:16050
node dist/apps/zetro/cli/main.js supervisor stop <task-id> --api http://127.0.0.1:16050
```

Set `ZETRO_SUPERVISOR_TOKEN` in both the desktop launch environment and the CLI environment.
Set `ZETRO_API_URL` to avoid repeating `--api`. Desktop can select a fallback port when 16050 is busy.
Use the desktop runtime address in that case. Connect the project and Codex account in Zetro first.

The request file contains `projectId`, `prompt`, `scope: {application, module, folderPath}`,
and optional `workflow`, `model`, and `reasoningEffort`. The CLI adds `approved: true` after `--confirm`.
Read the [Supervisor contract](../api/src/modules/supervisor/README.md) before submitting work.

Shared-package tasks use the same contract: `scope: {application: "ui", module: "", folderPath: "packages/ui"}`.
Use a separate application task for consumer integration. Documentation permissions never grant package writes.

`ui-audit` starts the repository-owned `check:ui-system` script as a durable System Task. Use
`watch <run-id>` to follow its result. The command does not let the agent modify code or rerun the
failed check without review.
