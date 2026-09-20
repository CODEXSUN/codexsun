#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to update Orship containers." >&2
  exit 1
}

[ -r "$VERSION_FILE" ] || {
  echo "Orship version file is missing: $VERSION_FILE" >&2
  exit 1
}

ORSHIP_VERSION=$(tr -d '\r\n' < "$VERSION_FILE")
[ -n "$ORSHIP_VERSION" ] || {
  echo "Orship version file is empty: $VERSION_FILE" >&2
  exit 1
}

NO_CACHE=""
if [ "${1:-}" = "--no-cache" ] || [ "${ORSHIP_UPDATE_NO_CACHE:-0}" = "1" ]; then
  NO_CACHE="--no-cache"
fi

echo "Updating Orship $ORSHIP_VERSION from the current repository state..."
if [ -n "$NO_CACHE" ]; then
  echo "Building without cache to include all dirty source changes..."
fi
docker compose -f "$COMPOSE_FILE" build --pull $NO_CACHE

echo "Recreating Orship containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Waiting for MariaDB, API, and web health..."
for attempt in $(seq 1 45); do
  database_ready=0
  api_ready=0
  web_ready=0
  if docker compose -f "$COMPOSE_FILE" exec -T mariadb healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; then database_ready=1; fi
  if docker compose -f "$COMPOSE_FILE" exec -T api node -e "fetch('http://127.0.0.1:6300/api/v1/orship/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then api_ready=1; fi
  if docker compose -f "$COMPOSE_FILE" exec -T web wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then web_ready=1; fi
  if [ "$database_ready" -eq 1 ] && [ "$api_ready" -eq 1 ] && [ "$web_ready" -eq 1 ]; then
    echo "MariaDB, API, and web are healthy."
    break
  fi
  echo "Health check attempt $attempt/45: mariadb=$database_ready api=$api_ready web=$web_ready"
  sleep 2
  if [ "$attempt" -eq 45 ]; then
    echo "Orship did not become healthy in time." >&2
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
  fi
done

echo "Current Orship container status:"
docker compose -f "$COMPOSE_FILE" ps
