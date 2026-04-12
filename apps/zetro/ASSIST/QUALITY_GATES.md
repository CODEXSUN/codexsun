# Quality Gates

Every Zetro slice must pass the smallest useful verification set.

## Code Changes

Run:

```powershell
npm.cmd run typecheck
```

Run targeted lint for touched Zetro files:

```powershell
npx.cmd eslint <touched-files>
```

## Terminal Changes

Run:

```powershell
npm.cmd run zetro -- summary
npm.cmd run zetro -- assist
npm.cmd run zetro -- doctor
```

If command behavior changes, also run the changed command directly.

## Dashboard Changes

Check routes:

```text
/dashboard/apps/zetro
/dashboard/apps/zetro/playbooks
/dashboard/apps/zetro/runs
/dashboard/apps/zetro/findings
/dashboard/apps/zetro/guardrails
/dashboard/apps/zetro/settings
```

## Persistence Changes

After Phase 2 starts:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

## Runner Changes

Runner work cannot merge unless:

1. allowlist exists
2. approval record exists
3. stdout capture exists
4. stderr capture exists
5. exit code capture exists
6. timeout exists
7. cancellation exists
8. run event persistence exists

Until then, runner mode remains manual or advisory only.
