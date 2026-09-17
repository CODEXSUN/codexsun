# CODEXSUN Task Status

Use this file to identify work that is active now. Read [planning.md](planning.md)
for scope, dependencies, acceptance checks, and later work.

## Active Work

No task is active.

## Next Task

| Task                                            | Owner    | State                           | Data impact |
| ----------------------------------------------- | -------- | ------------------------------- | ----------- |
| M-502 Static module ownership and import checks | Platform | Planned. Requires confirmation. | No          |

## Completed Milestones

- Foundation: F-001 through F-005.
- Framework kernel: F-101 through F-105.
- Platform runtime registry, configuration, readiness, and enablement: P-201 to P-204.
- Framework persistence contracts: D-301.
- Platform Kysely transaction adapter: D-302.
- Platform SQLite data adapter: D-303.
- Platform MariaDB data adapter: D-304.
- Data lifecycle policy and record template: D-305.
- Identity public contracts: I-401.
- Platform Identity module: I-402.
- JWT API authentication and actor-isolation boundary: I-403.
- In-memory Platform web session boundary: I-404.
- Aaran single-tenant deployment policy: I-405.
- Module generator template: M-501.

See [CHAGELOG.md](../documentation/CHAGELOG.md) for the release record and
`planning.md` for completed acceptance evidence.

## Planning Queue

| Area                      | Task IDs         | State         |
| ------------------------- | ---------------- | ------------- |
| Data foundation           | D-301 to D-305   | Planning only |
| Identity                  | I-401 to I-405   | Planning only |
| Module standard           | M-501 to M-504   | Planning only |
| Design system             | U-601 to U-606   | Planning only |
| API and web shell         | A-601 to A-606   | Planning only |
| Events and jobs           | E-701 to E-705   | Planning only |
| Operations and deployment | O-801 to O-805   | Planning only |
| Desktop                   | C-901 to C-904   | Planning only |
| Mobile                    | C-1001 to C-1004 | Planning only |
| Client deployment         | R-1101 to R-1103 | Planning only |
| Zetro                     | Z-1201 to Z-1202 | Planning only |
| Docs                      | D-1201 to D-1202 | Planning only |
| Orship                    | O-1201 to O-1202 | Planning only |
| UIUX                      | U-1201           | Planning only |

## Status Rules

- Only one task can be active unless the user approves parallel work.
- A planned task does not authorize code, dependencies, data, containers, or deployment changes.
- Mark a task complete only after its checks pass.
- Update the task state, plan, and changelog after completion.
