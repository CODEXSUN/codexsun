#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() {
  printf '%s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

require_cmd docker

COMPOSE_CMD=()
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  log "Docker Compose is not available."
  exit 1
fi

IMAGE_TAG="${IMAGE_TAG:-codexsun-app:v1}"

CODEXSUN_COMPOSE_FILE="${CODEXSUN_COMPOSE_FILE:-.container/clients/codexsun/docker-compose.yml}"
TMNEXT_COMPOSE_FILE="${TMNEXT_COMPOSE_FILE:-.container/clients/tmnext_in/docker-compose.yml}"
TIRUPUR_COMPOSE_FILE="${TIRUPUR_COMPOSE_FILE:-.container/clients/tirupur_direct/docker-compose.yml}"
TECHMEDIA_COMPOSE_FILE="${TECHMEDIA_COMPOSE_FILE:-.container/clients/techmedia_in/docker-compose.yml}"
NEOT_COMPOSE_FILE="${NEOT_COMPOSE_FILE:-.container/clients/neot_in/docker-compose.yml}"

CODEXSUN_CONTAINER="${CODEXSUN_CONTAINER:-codexsun-app}"
TMNEXT_CONTAINER="${TMNEXT_CONTAINER:-tmnext-in-app}"
TIRUPUR_CONTAINER="${TIRUPUR_CONTAINER:-tirupur-direct-app}"
TECHMEDIA_CONTAINER="${TECHMEDIA_CONTAINER:-techmedia-in-app}"
NEOT_CONTAINER="${NEOT_CONTAINER:-neot-in-app}"

CODEXSUN_VOLUME="${CODEXSUN_VOLUME:-codexsun_codexsun_runtime}"
TMNEXT_VOLUME="${TMNEXT_VOLUME:-tmnext-in_tmnext_in_runtime}"
TIRUPUR_VOLUME="${TIRUPUR_VOLUME:-tirupur-direct_tirupur_direct_runtime}"
TECHMEDIA_VOLUME="${TECHMEDIA_VOLUME:-techmedia-in_techmedia_in_runtime}"
NEOT_VOLUME="${NEOT_VOLUME:-neot-in_neot_in_runtime}"

stop_container() {
  local label="$1"
  local container_name="$2"

  if ! docker ps -a --format '{{.Names}}' | grep -Fxq "$container_name"; then
    log "Skipping ${label} container: ${container_name} not found"
    return
  fi

  log "Stopping ${label} container ${container_name}..."
  docker stop "$container_name" >/dev/null 2>&1 || true

  log "Removing ${label} container ${container_name}..."
  docker rm -f "$container_name" >/dev/null 2>&1 || true
}

stop_stack() {
  local label="$1"
  local compose_file="$2"

  if [ ! -f "$REPO_ROOT/$compose_file" ]; then
    log "Skipping ${label}: missing $compose_file"
    return
  fi

  log "Stopping ${label}..."
  "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$compose_file" down --remove-orphans -v || true
}

remove_volume() {
  local volume_name="$1"
  log "Removing volume ${volume_name}..."
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
}

log "Stopping Codexsun app containers, bringing stacks down, removing volumes, image, and unused Docker resources..."

stop_container "codexsun" "$CODEXSUN_CONTAINER"
stop_container "tmnext.in" "$TMNEXT_CONTAINER"
stop_container "tirupurdirect.in" "$TIRUPUR_CONTAINER"
stop_container "techmedia.in" "$TECHMEDIA_CONTAINER"
stop_container "neot.in" "$NEOT_CONTAINER"

stop_stack "codexsun" "$CODEXSUN_COMPOSE_FILE"
stop_stack "tmnext.in" "$TMNEXT_COMPOSE_FILE"
stop_stack "tirupurdirect.in" "$TIRUPUR_COMPOSE_FILE"
stop_stack "techmedia.in" "$TECHMEDIA_COMPOSE_FILE"
stop_stack "neot.in" "$NEOT_COMPOSE_FILE"

remove_volume "$CODEXSUN_VOLUME"
remove_volume "$TMNEXT_VOLUME"
remove_volume "$TIRUPUR_VOLUME"
remove_volume "$TECHMEDIA_VOLUME"
remove_volume "$NEOT_VOLUME"

log "Removing image ${IMAGE_TAG}..."
docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true

log "Pruning unused Docker resources..."
docker system prune -a -f --volumes >/dev/null 2>&1 || true
docker builder prune -a -f >/dev/null 2>&1 || true

log "Cleanup complete."
