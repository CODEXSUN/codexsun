# CODEXSUN Task Status

Use this file to identify work that is active now. Read [planning.md](planning.md)
for scope, dependencies, acceptance checks, and later work.

## Active Work

No task is active.

## Next Task

| Task                     | Owner         | State                           | Data impact |
| ------------------------ | ------------- | ------------------------------- | ----------- |
| Product module selection | Product owner | Planned. Requires confirmation. | Varies      |

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
- Module ownership and private-import checks: M-502.
- Module test conventions: M-503.
- Reference Platform Settings module: M-504.
- Semantic theme tokens and shared theme provider: U-601.
- Public UI component registry metadata: U-602.
- Base shadcn-compatible UI components: U-603.
- Reusable UI composition, Platform MDI wiring, and UIUX gallery: U-604 to U-606.
- Platform API contracts, centralized routes, shared UI composition, and verified browser flow: A-601 to A-606.
- Isolated app Turbo scopes, worktree environment rules, shared-package gate, and manual merge protocol.
- CODEXSUN app worktree CLI, local lifecycle records, agent session skill, scoped review gate, explicit approval, and fast-forward-only merge workflow.
- Redis runtime scaffold and configuration contract: E-701. Database-backed delivery remains selected.
- Database outbox, worker, idempotent consumer, and outbox observability: E-702 to E-705.
- Scoped storage, operation records, Docker composition, Aaran profile, and recovery runbook: O-801 to O-805.
- Platform Tauri desktop host, native metadata command, capability policy, shared UI, public contracts, and root output: C-901 to C-904.
- Platform Ionic and Capacitor mobile host, online policy, public contracts, and root web output: C-1001 to C-1004.
- Aaran selected deployment profile for Platform web, desktop, and mobile: R-1101 to R-1102. R-1103 is deferred.

See [CHAGELOG.md](../documentation/CHAGELOG.md) for the release record and
`planning.md` for completed acceptance evidence.

## Planning Queue

| Area                      | Task IDs                          | State                                   |
| ------------------------- | --------------------------------- | --------------------------------------- |
| Data foundation           | D-301 to D-305                    | Planning only                           |
| Identity                  | I-401 to I-405                    | Planning only                           |
| Module standard           | M-501 to M-504                    | Complete                                |
| Design system             | U-601 to U-606                    | Complete                                |
| API and web shell         | A-601 to A-606                    | Complete                                |
| Events and jobs           | E-701 to E-705                    | Complete with database delivery         |
| Operations and deployment | O-801 to O-805                    | Complete. Docker live check pending     |
| Desktop                   | C-901 to C-904                    | Complete                                |
| Mobile                    | C-1001 to C-1004                  | Complete. Device check pending          |
| Client deployment         | R-1101 to R-1103                  | Profile complete. Verification deferred |
| Zetro                     | Z-1201 to Z-1202                  | Planning only                           |
| Docs                      | D-1210 to D-1260                  | D-1210 and D-1220 complete.             |
| Orship                    | O-1201 to O-1202                  | Planning only                           |
| UIUX                      | U-1201 to U-1202 complete. U-1203 to U-1205 | Planned after U-1202          |

## Status Rules

- Only one task can be active unless the user approves parallel work.
- A planned task does not authorize code, dependencies, data, containers, or deployment changes.
- Mark a task complete only after its checks pass.
- Update the task state, plan, and changelog after completion.
