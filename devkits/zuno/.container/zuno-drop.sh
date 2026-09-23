#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to drop Zuno containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to drop Zuno containers." >&2
  exit 1
}

if [ -r "$VERSION_FILE" ]; then
  ZUNO_VERSION=${ZUNO_VERSION:-$(tr -d '\r\n' < "$VERSION_FILE")}
  ZUNO_IMAGE_TAG=${ZUNO_IMAGE_TAG:-$(printf '%s' "$ZUNO_VERSION" | sed 's/[^A-Za-z0-9_.-]/-/g')}
  export ZUNO_IMAGE_TAG ZUNO_VERSION
fi

compose() {
  docker compose \
    --project-name "${ZUNO_COMPOSE_PROJECT:-zunolocal}" \
    --file "$COMPOSE_FILE" \
    "$@"
}

echo "Stopping and removing Zuno containers, project volumes, and local images..."
compose down --volumes --remove-orphans --rmi local

echo "Zuno project ${ZUNO_COMPOSE_PROJECT:-zunolocal} was removed. External network ${ZUNO_DOCKER_NETWORK:-codexsun-network} was kept."
