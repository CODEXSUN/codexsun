# Automation observation pages

## Outcome and ownership

Automation web `0.3.0` separates live runs, history, script controls, and individual reports.
System Tasks web `1.1.0` exposes feed freshness and clears stale project selection.
The root candidate remains `0.1.20`. No API, migration, seed, or installer changed.

Zetro owns data, page composition, filtering, report content, and actions.
Existing public shared UI cards, tables, progress, buttons, and popovers own visual behavior.
The UI-design skill guided the restrained layout and optional floating connection card.

## References and bindings

- [Automation owner](../../../apps/zetro/web/src/modules/automation/README.md)
- [System Tasks owner](../../../apps/zetro/web/src/modules/system-tasks/README.md)
- [API contract](../../../apps/zetro/api/src/modules/system-tasks/README.md)

The existing System Tasks GET routes provide input, result, state, and durable steps.
Automation validates known instruction/result fields before display. It does not dump raw task input.
The feed polls every two seconds. Operations metrics poll every five seconds while visible.
The connection card marks stale data instead of claiming an active connection.
The outcome bar uses loaded history counts. It does not predict completion.
Provider tool events and response tokens are not streamed by the current API.

Stop requires confirmation and preserves completed changes. Diagnosis prepares a draft only.
Repository trust and backend retry restrictions remain enforced.
Full-page views remain within the existing `/zetro` desk route.

## Parallel work

Preserved existing Framework, Platform Identity, API execution, version, and desktop release changes.
No existing task, worktree, database, trust setting, or installed desktop process was removed.

## Verification

Five Automation tests passed. Zetro web typecheck, lint, build, and shared UI audit passed.
Largest production JavaScript chunk was below 400 KB with no build warnings.
Browser checks at `http://127.0.0.1:6060/zetro` verified live/history/script navigation,
empty history, connection freshness, actual API memory, Codex/database status, and trust denial.
The browser project had no runs. Executing a version check stopped at the trust guard.
No trust setting was changed. Populated run details, stop, and download need live acceptance.
No installer rebuild, reinstall, commit, or push was performed.
