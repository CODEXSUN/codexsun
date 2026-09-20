# CXForge

CXForge is the isolated coding worker server for Zuno. It owns task contracts, per-task workspaces, execution state, artifacts, and review evidence.

## Local Docker

```sh
docker network inspect codexsun-network >/dev/null 2>&1 || docker network create codexsun-network
docker compose -p cxforgefresh -f apps/cxforge/.container/compose.yml up -d --build
```

Health: `http://127.0.0.1:6400/api/v1/cxforge/health`

The local profile uses `CXFORGE_EXECUTION_MODE=demo` to prove the task lifecycle. Production should use a model-backed executor and a private workspace volume.
