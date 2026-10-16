# Site Studio skills

## App-owned skill

Use [site-studio](skills/site-studio/SKILL.md) for implementation, refactoring, review, and planning within `apps/sites`.
This repository-local skill is discovered through `apps/sites/AGENTS.md`. It is not installed as a global skill.

## Additional skills by task

Use the available session skill catalog to resolve these skills. Do not duplicate their instructions here.

| Skill                    | When to use                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `code-style`             | Write or edit code                                                |
| `technical-writing`      | Edit plans, agent guidance, or technical documentation            |
| `ui-design`              | Design Studio screens when no more specific design system applies |
| `cloudflare`             | Implement Worker, D1, domain, or Cloudflare deployment behavior   |
| `workers-best-practices` | Write or review Worker code                                       |
| `wrangler`               | Before running Wrangler commands                                  |
| `skill-creator`          | Create or update reusable agent skills                            |

Read the repository design-system helper before UI changes.
Read tenancy, API, migration, or deployment guidance when that area changes.
Do not use the Sites website-builder connector for this repository application unless the user explicitly requests that service.

Skills do not supply credentials, runtime authorization, deployment approval, or access to another tenant.
