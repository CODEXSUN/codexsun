#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
VERSION_FILE="$SCRIPT_DIR/../VERSION"

require_docker() {
  command -v docker >/dev/null 2>&1 || {
    echo "Docker is required to set up Zuno containers." >&2
    exit 1
  }

  docker compose version >/dev/null 2>&1 || {
    echo "Docker Compose is required to set up Zuno containers." >&2
    exit 1
  }
}

load_version() {
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
}

ensure_network() {
  ZUNO_DOCKER_NETWORK=${ZUNO_DOCKER_NETWORK:-codexsun-network}
  export ZUNO_DOCKER_NETWORK

  if docker network inspect "$ZUNO_DOCKER_NETWORK" >/dev/null 2>&1; then
    echo "Using existing Docker network: $ZUNO_DOCKER_NETWORK"
    return
  fi

  echo "Creating Docker network: $ZUNO_DOCKER_NETWORK"
  docker network create "$ZUNO_DOCKER_NETWORK" >/dev/null
}

compose() {
  docker compose \
    --project-name "${ZUNO_COMPOSE_PROJECT:-zunolocal}" \
    --file "$COMPOSE_FILE" \
    "$@"
}

wait_for_health() {
  attempt=1
  while [ "$attempt" -le 30 ]; do
    if compose exec -T zuno-api node -e "fetch('http://127.0.0.1:6410/api/v1/zuno/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"; then
      echo "Zuno is running at http://127.0.0.1:${ZUNO_WEB_HOST_PORT:-6411}"
      return
    fi

    echo "Health check attempt $attempt/30..."
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "Zuno did not become healthy in time." >&2
  compose ps
  exit 1
}

require_docker
load_version
ensure_network

echo "Building Zuno $ZUNO_VERSION API and web images..."
compose build

echo "Starting Zuno containers..."
compose up -d --remove-orphans

wait_for_health
