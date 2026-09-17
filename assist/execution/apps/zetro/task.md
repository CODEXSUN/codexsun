# Zetro Task Register

Read `planning.md` before work starts.

## Active Execution

No task is active.

## Approved Execution Rule

Each task needs a reviewed planning entry, an explicit approval, one owner, expected paths, data impact, risk, acceptance criteria, and named verification before worktree creation.

## Phase Status

| Phase | Tasks | Status |
| --- | --- | --- |
| Z-1200 | Z-1201 to Z-1204 | Z-1201 and Z-1202 complete. Z-1203 is next. |
| Z-1210 | Z-1211 to Z-1213 | Planned |
| Z-1220 | Z-1221 to Z-1223 | Planned |
| Z-1230 | Z-1231 to Z-1233 | Planned |
| Z-1240 | Z-1241 to Z-1243 | Planned |
| Z-1250 | Z-1251 to Z-1253 | Planned |
| Z-1260 | Z-1261 to Z-1264 | Planned |

## Next Task

- [ ] Z-1203: Agent Runtime Boundary
  - Status: planned. Requires plan review and approval.
  - Owner: Zetro Agent Runtime module.
  - Data impact: no migration. Configuration and public contracts only.
  - Verification: runtime contract tests, secret-redaction tests, `check:zetro`, line-ending check, and review evidence.

## Completion Rule

Mark a task complete only after its acceptance criteria pass. Record evidence in the current changelog version. A human must approve each merge, deployment, release, tag, and push.
