#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to update Zuno containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to update Zuno containers." >&2
  exit 1
}

[ -r "$VERSION_FILE" ] || {
  echo "Zuno version file is missing: $VERSION_FILE" >&2
  exit 1
}

ZUNO_VERSION=${ZUNO_VERSION:-$(tr -d '\r\n' < "$VERSION_FILE")}
[ -n "$ZUNO_VERSION" ] || {
  echo "Zuno version file is empty: $VERSION_FILE" >&2
  exit 1
}

ZUNO_IMAGE_TAG=${ZUNO_IMAGE_TAG:-$(printf '%s' "$ZUNO_VERSION" | sed 's/[^A-Za-z0-9_.-]/-/g')}
[ -n "$ZUNO_IMAGE_TAG" ] || {
  echo "Zuno version does not produce a valid Docker image tag: $ZUNO_VERSION" >&2
  exit 1
}
export ZUNO_IMAGE_TAG ZUNO_VERSION

ZUNO_DOCKER_NETWORK=${ZUNO_DOCKER_NETWORK:-codexsun-network}
export ZUNO_DOCKER_NETWORK

if ! docker network inspect "$ZUNO_DOCKER_NETWORK" >/dev/null 2>&1; then
  echo "Creating Docker network: $ZUNO_DOCKER_NETWORK"
  docker network create "$ZUNO_DOCKER_NETWORK" >/dev/null
fi

compose() {
  docker compose \
    --project-name "${ZUNO_COMPOSE_PROJECT:-zunolocal}" \
    --file "$COMPOSE_FILE" \
    "$@"
}

echo "Updating Zuno $ZUNO_VERSION from the current repository state..."
compose build --pull

echo "Recreating Zuno containers while preserving application data..."
compose up -d --force-recreate --remove-orphans

echo "Waiting for Zuno API and web health..."
attempt=1
while [ "$attempt" -le 30 ]; do
  if compose exec -T zuno-api node -e "fetch('http://127.0.0.1:6410/api/v1/zuno/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))" \
    && compose exec -T zuno-web wget -qO- http://127.0.0.1:6411/ >/dev/null; then
    echo "Zuno $ZUNO_VERSION is running at http://127.0.0.1:${ZUNO_WEB_HOST_PORT:-6411}"
    compose ps
    exit 0
  fi

  echo "Health check attempt $attempt/30..."
  sleep 2
  attempt=$((attempt + 1))
done

echo "Zuno did not become healthy in time." >&2
compose ps
exit 1
