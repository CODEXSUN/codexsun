#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE=.container/.env
if [[ ! -f "$ENV_FILE" ]]; then
  cp .container/.env.example "$ENV_FILE"
  random_value() { openssl rand -base64 48 | tr -d '=+/\n' | cut -c1-48; }
  sed -i "s|replace-with-a-long-random-password|$(random_value)|" "$ENV_FILE"
  sed -i "s|replace-with-a-long-random-secret|$(random_value)|" "$ENV_FILE"
  sed -i "s|replace-with-a-32-byte-base64-secret|$(openssl rand -base64 32 | tr -d '=+/\n' | cut -c1-43)|" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml config >/dev/null
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml up -d --build
docker compose --env-file "$ENV_FILE" -f .container/docker-compose.yml ps
