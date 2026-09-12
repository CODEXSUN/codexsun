# Working Set history

Date: 2026-09-12

## Outcome

Zetro history now lets a person select a completed prompt or response independently. The shared
Working Set stores each selection in SQLite, including its source kind and one explicit category:
idea, requirement, decision, visual reference, or reference.

## Flow

The history action adds source evidence to the Working Set. The user classifies or removes an item
in the drawer. Review sends the selected evidence into the composer as a consolidation request.
Create task draft sends the same immutable evidence to Agent Tasks. It does not alter an existing
task or a worker scope.

## Boundaries

`zetro.chat.api` owns evidence persistence and selection contracts. `zetro.shell.web` owns history
actions and drawer composition. `zetro.agent-tasks.api` receives a snapshot only. Inline answers to
individual open decisions are saved as durable decision items. Mermaid code fences render through a
shared, local-script visual block; editing the source stays local and does not change history.

## Verification

- Chat repository tests cover independent prompt/response evidence, inline decision persistence,
  categories, and restart persistence.
- Zetro API tests, contracts build, web build, and shared UI audit pass.
