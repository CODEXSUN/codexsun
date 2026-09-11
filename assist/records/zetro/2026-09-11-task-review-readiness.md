# Task review readiness

Date: 2026-09-11

## Outcome

The Zetro Task Queue now shows a review canvas before task confirmation. The canvas provides
icon navigation for scope, ideas, benefits, concerns, before-task steps, and after-task evidence.

The page uses only the durable task prompt, result, and origin conversation as available context.
It does not claim access to a separate global memory or invent a review result.

## Required review

- Select the approved module or folder.
- Define scope and acceptance criteria.
- Name the allowed verification checks.
- Capture a provider and revision receipt.
- Confirm the review before any future task start action.

## Boundaries

`zetro.agent-tasks.web` owns this draft-only review presentation. The API schema, draft state,
approval, execution, subtasks, verification, delivery, and release behavior do not change.

## Verification

- Passed the Zetro web type check and production build.
- Passed the shared UI and module boundary checks.
- Browser verification confirms the Task Queue review canvas and its icon navigation.
