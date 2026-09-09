# Zetro CLI

`@codexsun/zetro-cli` is the terminal client for deterministic Zetro automation. It calls the same HTTP contracts as the web and desktop interfaces. It does not duplicate Git commands, repository script execution, worktree cleanup, or task persistence.

Build and invoke it from the repository root:

```powershell
npm.cmd run zetro -- health
npm.cmd run zetro -- projects
npm.cmd run zetro -- scripts <project-id>
npm.cmd run zetro -- run <project-id> test
npm.cmd run zetro -- tasks <project-id>
npm.cmd run zetro -- watch <run-id>
```

Set `ZETRO_API_URL` when the API does not use `http://127.0.0.1:6050`. A secured desktop API also requires `ZETRO_SESSION_TOKEN`. Keep this token in the process environment and do not save it in scripts or repository files.

Git push, commit, release execution, cleanup scripts, and worktree sweeps require `--confirm`. Preview the repository or release state first. Agent supervision is intentionally absent from the CLI; failed runs are handed to Agent Chat from the Automation workspace only when a user selects **Diagnose with agent**.
