# Codeit product specification

Status: proposed behavior. This plan does not implement these features.

## Purpose

Codeit helps developers build applications through persistent conversation and visible work artifacts.
The main path is request, context, plan, tasks, tool calls, changes, tests, review, and delivery.
The user can work directly or delegate bounded tasks under one supervisor.

The first product is local, with one human operator and multiple projects.
It runs independently from Platform. Optional tenant integration retains Platform identity and isolation contracts.
Personalization changes communication and preferred workflows. It never grants execution rights.

## Primary journeys

| Journey          | Result                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Ask about code   | Read selected context and explain with file references                                   |
| Request a plan   | Produce editable scope, decisions, tasks, dependencies, and tests without source changes |
| Build a feature  | Execute authorized work, show changes, run checks, and provide evidence                  |
| Fix a failure    | Reproduce the failure, make a focused correction, and rerun checks                       |
| Review changes   | Inspect an exact diff and report actionable file and line findings                       |
| Delegate work    | Show assignments, ownership, budgets, blockers, and integration status                   |
| Resume work      | Restore history, accepted decisions, grants, artifacts, and last verified revision       |
| Personalize work | Review facts and preferences, choose scope, edit, and forget                             |

## Work tone

Use calm, direct language. Lead with the outcome or current finding.
Show concise progress when work advances. Avoid repetitive status messages and unsupported success claims.
Ask a focused question when the answer changes a required decision.
Continue routine authorized work using accepted instructions.
Explain real approval boundaries. Do not invent approval steps for harmless work.
Place evidence beside results: diff, command, exit code, test report, or browser artifact.
Preserve corrections to scope and terminology.

Tone matching means consistent work language and interaction structure.
It does not mean proprietary prompts or unverified pixel matching.
The existing UIUX components are the visual baseline.

## Personalization facts

| Class               | Examples                                | Persistence                                                      |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Explicit preference | Concise updates, language, review style | Explicit save or a user-approved memory mode                     |
| Project rule        | npm, owner modules, date format         | Record source path and revision. Re-read changed sources         |
| Confirmed fact      | API port, test command                  | Store provenance and verification time. Mark stale after changes |
| Inference           | Suspected style preference              | Suggest until accepted                                           |
| Sensitive material  | API key, password, personal record      | Exclude from personalization. Use authorized secret storage      |

Each saved fact needs an owner, scope, source, status, revision, and delete control.
Scopes are user, project, and conversation. Project facts stay within their project by default.
The context preview shows which facts will reach a provider.
Conflicts need an explicit precedence check and visible resolution.
Never save credentials or entire private files as memory shortcuts.
Deleting a fact invalidates derived summaries and future retrieval. Explain backup and audit retention limits.
No undisclosed personal facts are assumed in this plan.

## First product features

- Project picker with verified root and trusted-project state.
- Persistent chat, attachments, model selection, streaming, cancel, retry, and resume.
- Ask, Plan, Work, and Review modes with backend-enforced capability differences.
- Editable plans and dependency-aware tasks.
- Scoped search, file reads, patches, bounded commands, Git diff, diagnostics, and browser checks.
- Supervisor and workers with ownership, cancellation, recovery, and integration review.
- Change review, test evidence, approvals, artifacts, and failure surfaces.
- Provider, tools, plugins, personalization, budgets, and audit settings.
- Loading, empty, unavailable, disconnected, denied, conflicting, and failed states.

## Initial exclusions and acceptance

Exclude autonomous production deployment, account messaging, and broad machine administration.
Do not promise universal IDE extension compatibility, offline models, or mobile editing.
Cloud collaboration and remote workers need separate identity and isolation review.
Codeit does not copy business entities from the applications it helps develop.

A user must complete the golden path in E2E-VERIFICATION.md on a disposable project.
History survives restart. Every reported change and check has evidence.
Tool disable, grant revocation, and cancellation stop new capability use immediately.
