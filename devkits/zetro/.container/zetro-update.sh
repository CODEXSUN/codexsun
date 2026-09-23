#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ZETRO_NETWORK=${ZETRO_NETWORK:-codexsun-network}

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to update Zetro containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to update Zetro containers." >&2
  exit 1
}

docker network inspect "$ZETRO_NETWORK" >/dev/null 2>&1 || {
  echo "Docker network is missing: $ZETRO_NETWORK. Run zetro-setup.sh first." >&2
  exit 1
}

NO_CACHE=""
if [ "${1:-}" = "--no-cache" ] || [ "${ZETRO_UPDATE_NO_CACHE:-0}" = "1" ]; then
  NO_CACHE="--no-cache"
fi

echo "Updating Zetro from the current repository state..."
if [ -n "$NO_CACHE" ]; then
  echo "Building without cache to include all source changes..."
fi
docker compose -f "$COMPOSE_FILE" build --pull $NO_CACHE

echo "Recreating Zetro containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Waiting for Zetro API and web health..."
for attempt in $(seq 1 30); do
  api_ready=0
  web_ready=0
  if docker compose -f "$COMPOSE_FILE" exec -T api node -e "fetch('http://127.0.0.1:6130/api/zetro/v1/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then api_ready=1; fi
  if docker compose -f "$COMPOSE_FILE" exec -T web wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then web_ready=1; fi
  if [ "$api_ready" -eq 1 ] && [ "$web_ready" -eq 1 ]; then
    echo "Zetro API and web are healthy."
    docker compose -f "$COMPOSE_FILE" ps
    exit 0
  fi
  echo "Health check attempt $attempt/30: api=$api_ready web=$web_ready"
  sleep 2
done

echo "Zetro did not become healthy in time." >&2
docker compose -f "$COMPOSE_FILE" ps
exit 1
