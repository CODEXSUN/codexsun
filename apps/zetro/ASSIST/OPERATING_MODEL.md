# Operating Model

Zetro has three surfaces.

## 1. Terminal

Entry:

```powershell
npm.cmd run zetro -- help
```

Purpose:

1. Quick planning.
2. Catalog inspection.
3. Future session-based agent work.
4. Future approved runner workflows.

Current mode:

Manual only.

## 2. Dashboard

Entry:

```text
/dashboard/apps/zetro
```

Purpose:

1. Browse playbooks.
2. Inspect runs.
3. Track findings.
4. Manage guardrails.
5. Manage settings.

Current mode:

Static catalog.

## 3. Backend

Future location:

```text
apps/zetro/src/services
```

Purpose:

1. Persist playbooks.
2. Persist runs.
3. Persist events.
4. Persist findings.
5. Evaluate guardrails.
6. Enforce runner policy.

Current mode:

Manifest and terminal only.

## Boundary Rule

Zetro owns workflow logic.

`apps/cxapp` owns auth and dashboard composition.

`apps/ui` owns shared UI.

`apps/api` owns transport routes.

`apps/cli` may host narrow command helpers once Zetro has approval and audit records.
