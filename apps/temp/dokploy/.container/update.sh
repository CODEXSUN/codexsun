#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE=.container/.env
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE; run setup.sh first." >&2; exit 1; }
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml config >/dev/null
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml build --pull dokploy
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml up -d --no-build dokploy
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml ps
