# Zuno

Zuno manages CXForge containers through its authenticated API.

Each container has one Git checkout at /workspace. Setup clones the repository, prepares environment values, installs dependencies, checks migrations, and starts a preview. Further commands use the same checkout. Create another container for a separate workspace.

The workspace screen replaces the old assignment, mirror, and revision-approval screens. Zuno no longer exposes the old task creation, queue, publish, merge, or repository-sync endpoints. Command execution records still use the worker's internal task IDs.

Git credentials belong to each worker connection. Zuno no longer uses a global GitHub token to create or merge pull requests. This change does not implement a replacement pull-request approval UI.

See [Workspace provisioning](agent/workspace-provisioning.md) for API instructions and verification.
See [Local Docker usage](agent/readme.md) for Zuno setup, update, and drop scripts.

Existing identity data, Zetro handoffs, worker credentials, and workspaces remain intact. Old stored audit rows are retained but no longer read. This cleanup does not delete containers or databases.

Run package commands from the repository root. The app does not own a node_modules directory.

Docker access gives Zuno control of the host. Use the local profile only with trusted operators. A public deployment requires per-user authorization, quotas, and a protected preview gateway.
