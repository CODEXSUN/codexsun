# Agent Crew Shared UI Alignment

Date: 2026-09-09

## Outcome

The Agent Crew dashboard now uses public `@codexsun/ui` components and workspace blocks. It no
longer owns custom button, form-control, card, metric, alert, or switch styles.

## Database Changes

None.

## Verification

- Agent Crew web type check, lint, and production build.
- Shared UI application-source audit and boundary check.

## Deployment follow-up

The shared static container template now receives the API upstream from the deployment
catalog. Agent Crew declares `agent-crew-api:6100`; it no longer inherits the Orship
upstream. Runtime validation and generated Compose validation passed. The Agent Crew
worker image built successfully. A full live web-container replacement remains pending
because Docker BuildKit stalled in the static image dependency-install layer. The existing
ZXA container and its data were retained.
