# Planning

## Current Batch

### Reference

`#108`

### Title

`ASSIST consolidation and startup workflow hardening`

## Objective

Consolidate `ASSIST` into a smaller operating manual that future agents can read quickly, trust, and follow before starting development.

## Scope

1. remove stale `ASSIST` content that no longer helps active development
2. keep only rules, ownership guidance, contribution discipline, changelog history, and active execution tracking
3. add one explicit startup flow so future prompts can begin with `Read ASSIST/README.md and then start`
4. document task planning, task tracking, changelog, and git-helper expectations in one place

## Decisions

1. `ASSIST/README.md` is the entrypoint for future development prompts.
2. `ASSIST/AI_RULES.md` remains the rulebook, but the README tells agents to read the whole current `ASSIST` set first.
3. Old planning, database, worklog, and completed-task archives should not remain in `ASSIST`.
4. `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` are for active tracked work, not permanent history.
5. Historical release context stays in `ASSIST/Documentation/CHANGELOG.md`.
6. Shared UI source-of-truth paths must match the actual repo layout under `apps/ui/src/design-system/data`, `apps/ui/src/registry`, and `apps/ui/src/components/blocks`.

## Validation

Manual review only for this documentation batch.

1. confirmed the remaining `ASSIST` file set
2. corrected guidance to use the real shared UI paths
3. aligned startup rules, execution tracking rules, and git-helper expectations
4. left changelog historical references intact even when they mention deleted planning files
