# T01: Work shell and chat UI

Status: planned. Prerequisites: T00. Owner: UI worker.

## Scope

Implement the chat-led work surface from UI-WORKFLOWS.md.
Add project/conversation navigation, composer modes, context references, tool cards, artifacts, inspector, and run status.
Use contract fixtures only in tests. Production screens consume real owner services when their dependencies are integrated.
Preserve the overview, settings, theme, five regions, and standalone web route behavior.

## Allowed paths

Lease frontend conversation UI files under `devkits/codeit/src/modules/conversation` and UI-specific tests.
The integrator applies shell changes in `src/codeit-app.tsx`, navigation exports, and global styles.
Do not implement provider credentials, tool policy, or run persistence in React.

## Acceptance

- Ask, Plan, Work, and Review modes show effective capability state.
- Draft, stream, cancel, error, denied, interrupted, empty, and unavailable states are usable.
- Panels preserve conversation and focus. Context and evidence remain inspectable.
- Desktop and narrow layouts pass keyboard, contrast, clipping, and focus checks.

## Verification and handoff

Run frontend typecheck, lint, build, and focused component/browser checks.
Cover E24 and the UI portions of E04/E06/E22.
Return screenshots with actual viewport, interaction steps, service dependencies, shared-file requests, and templates/HANDOFF.md.
Do not claim durable chat or real model execution from fixture-rendered UI.
