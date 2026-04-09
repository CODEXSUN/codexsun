#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

CODEXSUN_VOLUME="${CODEXSUN_VOLUME:-codexsun_codexsun_runtime}"
TMNEXT_VOLUME="${TMNEXT_VOLUME:-tmnext-in_tmnext_in_runtime}"
TIRUPUR_VOLUME="${TIRUPUR_VOLUME:-tirupur-direct_tirupur_direct_runtime}"

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

log "Cleaning Codexsun app stacks, runtime volumes, image, and unused Docker resources..."

stop_stack "codexsun" "$CODEXSUN_COMPOSE_FILE"
stop_stack "tmnext.in" "$TMNEXT_COMPOSE_FILE"
stop_stack "tirupurdirect.com" "$TIRUPUR_COMPOSE_FILE"

remove_volume "$CODEXSUN_VOLUME"
remove_volume "$TMNEXT_VOLUME"
remove_volume "$TIRUPUR_VOLUME"

log "Removing image ${IMAGE_TAG}..."
docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true

log "Pruning unused Docker resources..."
docker system prune -a -f --volumes >/dev/null 2>&1 || true
docker builder prune -a -f >/dev/null 2>&1 || true

log "Cleanup complete."
