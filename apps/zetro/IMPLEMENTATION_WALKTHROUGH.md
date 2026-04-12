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

1. Manual runner.
2. Database-backed catalog with JSON store.
3. Run output sections.
4. Command proposals with policy validation.
5. Command allowlist with blocked/sensitive commands.
6. No LLM call.
7. No command execution.
8. No background loop.

Phase: 1.3.1 complete (Runner Policy And Allowlist)
