# Sites agent entry point

Read the repository `assist/AGENT-GUIDE.md` and `assist/governance/rules.md` first.
Then read `agent/README.md`, `agent/skills.md`, and `agent/PLAN.md` in this app.
Read `STUDIO-PLAN.md` for the product architecture and phase acceptance gates.

All Site Studio implementation and tests belong under `apps/sites`.
Use Platform identity and shared capabilities through public contracts.
Do not add Studio business logic or screens to Platform.
Keep existing host composition references distinct from Studio implementation.
An agent instruction or skill never grants runtime permissions or weakens backend checks.
