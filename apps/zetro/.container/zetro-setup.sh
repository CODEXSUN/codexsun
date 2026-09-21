#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ZETRO_NETWORK=${ZETRO_NETWORK:-codexsun-network}

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to set up Zetro containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to set up Zetro containers." >&2
  exit 1
}

if docker network inspect "$ZETRO_NETWORK" >/dev/null 2>&1; then
  echo "Using existing Docker network: $ZETRO_NETWORK"
else
  echo "Creating Docker network: $ZETRO_NETWORK"
  docker network create "$ZETRO_NETWORK" >/dev/null
fi

echo "Building Zetro API and web images..."
docker compose -f "$COMPOSE_FILE" build

echo "Starting Zetro containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Waiting for Zetro API and web health..."
for attempt in $(seq 1 30); do
  api_ready=0
  web_ready=0
  if docker compose -f "$COMPOSE_FILE" exec -T api node -e "fetch('http://127.0.0.1:6130/api/zetro/v1/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then api_ready=1; fi
  if docker compose -f "$COMPOSE_FILE" exec -T web wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then web_ready=1; fi
  if [ "$api_ready" -eq 1 ] && [ "$web_ready" -eq 1 ]; then
    echo "Zetro is running at http://127.0.0.1:${ZETRO_WEB_PUBLISHED_PORT:-6131}"
    exit 0
  fi
  echo "Health check attempt $attempt/30: api=$api_ready web=$web_ready"
  sleep 2
done

echo "Zetro did not become healthy in time." >&2
docker compose -f "$COMPOSE_FILE" ps
exit 1
