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

echo "Updating Orship $ORSHIP_VERSION from the current repository state..."
docker compose -f "$COMPOSE_FILE" build --pull

echo "Recreating Orship containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Current Orship container status:"
docker compose -f "$COMPOSE_FILE" ps
