# Decisions and assumptions

Status: planning defaults, not user confirmation of undisclosed personal facts.
T00 records accepted decisions before dependent implementation begins.

## Established constraints

- The current request is documentation only, inside `devkits/codeit/agent`.
- Codeit is a coding/development assistant workspace with chat, tools, plugins, and personalization.
- Preserve standalone operation and the existing UIUX/CODEXSUN design pattern.
- Prepare supervisor/worker delivery for Antigravity and OpenCode.
- Preserve repository ownership, dependency, output, tenancy, and evidence rules.

## Proposed defaults

| Decision               | Proposed default                                                                    | Owner and blocking point                           |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| Initial operator model | One local human, several isolated projects                                          | Supervisor accepts at T00                          |
| Runtime                | One local Codeit API and bounded runners                                            | Architecture review at T00                         |
| Port                   | Web 7070, proposed API 7071                                                         | Integrator verifies availability at T00            |
| Storage                | Private embedded SQLite metadata plus artifact files                                | T00 adapter and migration proof                    |
| Provider               | Provider-neutral interface, one approved initial adapter                            | User/account choice before T03 live smoke          |
| Personal facts         | Explicit save, scoped retrieval, edit and forget                                    | Product review before T11                          |
| Worker count           | Maximum two implementation workers initially                                        | T00 resource ceiling, T09 stress verification      |
| File ownership         | Separate checkouts when compatible, otherwise disjoint leases and serialized writes | T00 repository/dependency proof                    |
| Code execution         | Only after OS-enforced boundary is proved                                           | Hard gate before T06/T07                           |
| Cross-IDE integration  | Portable manual dispatch first                                                      | Automatic adapter requires later approval          |
| Tenant behavior        | Local-only data first, optional navigation bridge                                   | Separate identity design before tenant data access |

## Required unresolved choices

Select a real provider and model with an authorized account. Do not invent credentials or assume a consumer subscription grants API use.
Prove a maintained SQLite adapter under current Node, Windows, root workspaces, and target packaging.
Choose and test the Windows runner boundary, including filesystem, child process, secret, and network isolation.
Choose local pairing/session storage and OS secret storage that satisfy host and port separation requirements.
Define token, time, output, storage, and concurrency budgets from target hardware and account limits.
Confirm whether a hosted/tenant product is required before designing a tenant data bridge.
Collect the user's actual personalization facts before seeding any personal profile.

These choices block only dependent implementation. Independent planning and read-only inspection can continue.

## Change control

Record decision ID, date, author, evidence, accepted choice, alternatives, affected tasks, and contract revision.
If a decision changes, invalidate incompatible worker assignments and stale verification evidence.
Do not treat inferred preferences, old source snapshots, or another agent's suggestion as current user authority.
