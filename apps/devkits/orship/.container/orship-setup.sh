#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to set up Orship containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to set up Orship containers." >&2
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

echo "Building Orship $ORSHIP_VERSION API and web images..."
docker compose -f "$COMPOSE_FILE" build

echo "Starting Orship containers..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Waiting for Orship API health..."
for attempt in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T api node -e "fetch('http://127.0.0.1:6300/api/v1/orship/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "Orship is running at http://127.0.0.1:${ORSHIP_WEB_PUBLISHED_PORT:-6301}"
    exit 0
  fi
  sleep 2
  echo "Health check attempt $attempt/30..."
done

echo "Orship did not become healthy in time." >&2
docker compose -f "$COMPOSE_FILE" ps
exit 1
