# Application Execution Records

Each application owns two records:

- `planning.md` contains ideas, features, scope, exclusions, risks, acceptance criteria, and phase order.
- `task.md` contains executable task IDs, phase, checkbox status, approval, owner, data impact, and verification.

Use short task IDs only:

| Application | Prefix | Example worktree key |
| --- | --- | --- |
| Platform | `P` | `platform-p-1201` |
| Docs | `D` | `docs-d-1231` |
| Zetro | `Z` | `zetro-z-1203` |
| UIUX | `U` | `uiux-u-1203` |

The sequence is mandatory:

```text
planning -> task approval -> worktree create -> verify -> develop -> review -> human approval -> fast-forward merge
```

Do not write application code before the plan and task record are reviewed and approved.
