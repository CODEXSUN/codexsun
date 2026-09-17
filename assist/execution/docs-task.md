# Docs Task Register

Read `docs-planning.md` before work starts.

## Active Work

No Docs task is active. D-1210 and D-1220 are complete.

## Next Task

| Task                                                         | Owner    | State                           | Data impact |
| ------------------------------------------------------------ | -------- | ------------------------------- | ----------- |
| D-1231 Markdown metadata, headings, anchors, tags, and links | Docs API | Planned. Requires confirmation. | No          |

## Task Rules

1. Confirm one task ID before code or dependency changes.
2. State the owner, scope, acceptance criteria, and verification checks.
3. Keep the task inside one Docs module or named composition root.
4. Keep source documents in place and treat SQLite as a derived index.
5. Update this register, the plan, local README files, and the changelog after completion.

## Planned Task Queue

| Phase                              | Tasks            | State    |
| ---------------------------------- | ---------------- | -------- |
| D-1210 Contracts and configuration | D-1211 to D-1214 | Complete |
| D-1220 Discovery and indexing      | D-1221 to D-1225 | Complete |
| D-1230 Parsing and retrieval       | D-1231 to D-1234 | Planned  |
| D-1240 Connected graph             | D-1241 to D-1245 | Planned  |
| D-1250 Web workspace               | D-1251 to D-1255 | Planned  |
| D-1260 Verification and handoff    | D-1261 to D-1264 | Planned  |

## Acceptance Template

Each confirmed Docs task must state:

- The selected task ID and owner.
- The source paths and SQLite tables that it affects.
- The public contracts that it adds or changes.
- The required focused tests.
- The required browser-visible checks.
- Any migration, recovery, or privacy risk.
