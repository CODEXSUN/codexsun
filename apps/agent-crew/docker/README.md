# Agent Crew Docker execution

The generated deployment Compose file builds three Agent Crew components:
the Fastify control API, static React dashboard, and private Node/Python worker.

The worker image pins Codex CLI `0.153.2` and OpenCode `1.18.30`. It contains
Python 3 for future repository-owned automation tools, but runs one Node worker
process. It never mounts the Docker socket. The generated profile mounts named
workspace and credentials volumes only into the worker.

Use `npm.cmd run runtime:compose -- development`, then set the Agent Crew values
in `dist/deployments/development/environment.env`. Provider login state belongs
in the worker credential volume; do not put it in the dashboard or profile JSON.
