#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLIENTS_DIR="$CONTAINER_ROOT/clients"
CLIENT_LIST_FILE="$CONTAINER_ROOT/client-list.md"

log() {
  printf '%s\n' "$*"
}

die() {
  log "$*"
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "Missing required command: $1"
  fi
}

discover_clients() {
  AVAILABLE_CLIENTS=()

  if [ -f "$CLIENT_LIST_FILE" ]; then
    while IFS= read -r listed_client; do
      [ -n "$listed_client" ] || continue
      [ -d "$CLIENTS_DIR/$listed_client" ] || die "Client '$listed_client' is listed in $CLIENT_LIST_FILE but missing under $CLIENTS_DIR"
      [ -f "$CLIENTS_DIR/$listed_client/docker-compose.yml" ] || die "Client '$listed_client' is listed in $CLIENT_LIST_FILE but missing docker-compose.yml"
      AVAILABLE_CLIENTS+=("$listed_client")
    done < <(
      awk -F'|' '
        /^\|/ {
          client_id=$2
          gsub(/^[[:space:]]+|[[:space:]]+$/, "", client_id)
          if (client_id != "" && client_id != "client_id" && client_id != "---") {
            print client_id
          }
        }
      ' "$CLIENT_LIST_FILE"
    )
  fi

  if [ "${#AVAILABLE_CLIENTS[@]}" -gt 0 ]; then
    return
  fi

  local client_dir
  for client_dir in "$CLIENTS_DIR"/*; do
    [ -d "$client_dir" ] || continue
    [ -f "$client_dir/docker-compose.yml" ] || continue
    AVAILABLE_CLIENTS+=("$(basename "$client_dir")")
  done

  [ "${#AVAILABLE_CLIENTS[@]}" -gt 0 ] || die "No client compose folders were found under $CLIENTS_DIR"
}

parse_selected_clients() {
  SELECTED_CLIENTS=()
  local input="${CLIENTS:-all}"

  if [ "$input" = "all" ]; then
    SELECTED_CLIENTS=("${AVAILABLE_CLIENTS[@]}")
    return
  fi

  local candidate found
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    found="false"
    local known
    for known in "${AVAILABLE_CLIENTS[@]}"; do
      if [ "$known" = "$candidate" ]; then
        found="true"
        break
      fi
    done
    [ "$found" = "true" ] || die "Unknown client: $candidate"
    SELECTED_CLIENTS+=("$candidate")
  done < <(printf '%s' "$input" | tr ',' '\n')

  [ "${#SELECTED_CLIENTS[@]}" -gt 0 ] || die "No clients selected."
}

parse_compose_container_name() {
  local compose_file="$1"
  awk '/^[[:space:]]*container_name:[[:space:]]*/ { print $2; exit }' "$compose_file"
}

stop_container() {
  local label="$1"
  local container_name="$2"

  [ -n "$container_name" ] || return

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

  if [ ! -f "$compose_file" ]; then
    log "Skipping ${label}: missing $compose_file"
    return
  fi

  log "Stopping ${label}..."
  "${COMPOSE_CMD[@]}" -f "$compose_file" down --remove-orphans -v || true
}

require_cmd docker

COMPOSE_CMD=()
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  die "Docker Compose is not available."
fi

IMAGE_TAG="${IMAGE_TAG:-codexsun-app:v1}"
CONFIRM_DESTRUCTIVE_CLEAN="${CONFIRM_DESTRUCTIVE_CLEAN:-}"

if [ "$CONFIRM_DESTRUCTIVE_CLEAN" != "YES" ]; then
  log "Refusing destructive cleanup."
  log "Set CONFIRM_DESTRUCTIVE_CLEAN=YES to remove client containers, volumes, image, and prune Docker resources."
  exit 1
fi

discover_clients
parse_selected_clients

log "Stopping registered client stacks, removing runtime volumes through compose, deleting image ${IMAGE_TAG}, and pruning unused Docker resources..."
log "Selected clients: $(printf '%s ' "${SELECTED_CLIENTS[@]}" | sed 's/[[:space:]]*$//')"

for client_id in "${SELECTED_CLIENTS[@]}"; do
  compose_file="$REPO_ROOT/.container/clients/$client_id/docker-compose.yml"
  container_name="$(parse_compose_container_name "$compose_file")"
  stop_container "$client_id" "$container_name"
  stop_stack "$client_id" "$compose_file"
done

log "Removing image ${IMAGE_TAG}..."
docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true

log "Pruning unused Docker resources..."
docker system prune -a -f --volumes >/dev/null 2>&1 || true
docker builder prune -a -f >/dev/null 2>&1 || true

log "Cleanup complete."
