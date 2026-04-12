# Zetro Walkthrough

The active walkthrough now lives in `ASSIST/WALKTHROUGH.md`.

Quick terminal start:

```powershell
npm.cmd run zetro -- help
npm.cmd run zetro -- chat
npm.cmd run zetro -- doctor
npm.cmd run zetro -- run run-static-catalog
npm.cmd run zetro -- output run-static-catalog
npm.cmd run zetro -- proposals
npm.cmd run zetro -- propose --run <id> --cmd <cmd> --summary <summary>
```

Quick dashboard start:

```text
http://localhost:5173/dashboard/apps/zetro
```

Current mode:

1. CLI runner with approval workflow.
2. Database-backed catalog with JSON store.
3. Run output sections.
4. Command proposals with policy validation.
5. Command allowlist with blocked/sensitive commands.
6. Command execution with stdout/stderr capture.
7. Model provider adapters (none, ollama, openai, anthropic).
8. No background loop.

Phase: 1.5.0 complete (Model Provider Adapter)
