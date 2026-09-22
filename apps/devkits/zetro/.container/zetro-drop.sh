#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
PURGE=""

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required to stop Zetro containers." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose is required to stop Zetro containers." >&2
  exit 1
}

if [ "${1:-}" = "--purge" ]; then
  PURGE="--volumes"
  echo "Dropping Zetro containers and the zetro-storage volume..."
else
  echo "Dropping Zetro containers while retaining the zetro-storage volume."
  echo "Pass --purge to also remove Zetro's SQLite data."
fi

docker compose -f "$COMPOSE_FILE" down --remove-orphans $PURGE
