# Add-on integration guides

Each external CODEXSUN add-on has an integration guide under `addons/<name>`.
Each guide contains `README.md`, `agent/TASK.md`, `agent/PLAN.md`, and `agent/SKILLS.md`.

These folders document host ownership, public contracts, package pins, migrations, and verification.
They do not replace vendor packages or create local copies of published business code.
Install add-ons through the root npm installation and preserve registry integrity locks.

The current external add-on is [Blog](blog/README.md), installed as `@codexsun/blog`.
Run `npm run check:component-docs` and `npm run addons:check` from the repository root.
