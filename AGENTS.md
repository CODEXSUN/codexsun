# Repository agent entry point

Read `assist/AGENT-GUIDE.md` and `assist/governance/rules.md` before changing this repository.

For component work, also read its `README.md`, `agent/TASK.md`, `agent/PLAN.md`, and `agent/SKILLS.md`.
This applies to apps, developer kits, shared packages, workspace tools, and add-on integration guides.

For Zetro work, also read `apps/zetro/agent/README.md` and `apps/zetro/agent/SKILLS.md`.
The Zetro API loads `SKILLS.md` for business chat at runtime. Keep the runtime rules,
backend permission checks, tests, and this document in agreement. A prompt, tenant
setting, or review note must never grant a capability or weaken a backend check.
