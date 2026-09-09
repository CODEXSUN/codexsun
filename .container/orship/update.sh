#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose.yaml"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

CHECK_ONLY=false
ASSUME_YES=false
ALLOW_DIRTY=false
NO_CACHE=false
LOCK_DIR="${TMPDIR:-/tmp}/codexsun-orship-update.lock"
LOCK_HELD=false

blue='\033[1;34m'
green='\033[1;32m'
yellow='\033[1;33m'
red='\033[1;31m'
reset='\033[0m'

info() { printf "${blue}[orship]${reset} %s\n" "$*"; }
ok() { printf "${green}[passed]${reset} %s\n" "$*"; }
warn() { printf "${yellow}[notice]${reset} %s\n" "$*"; }
fail() { printf "${red}[failed]${reset} %s\n" "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: bash ./update.sh [options]

Rebuild and safely restart the standalone Orship Docker Compose deployment.
The command never pulls Git source. Update the repository yourself, review it,
then run this command from the repository root.

Options:
  --check          Run preflight checks without building or restarting.
  --yes            Do not ask for confirmation.
  --allow-dirty    Permit a build from a dirty Git worktree.
  --no-cache       Rebuild Docker images without the Docker build cache.
  --help           Show this help text.
EOF
}

cleanup_lock() {
  if [ "$LOCK_HELD" = true ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
}

acquire_lock() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    fail "Another Orship update appears to be running. If it stopped unexpectedly, remove $LOCK_DIR after confirming no update is active."
  fi
  LOCK_HELD=true
  trap cleanup_lock EXIT
}

require_docker() {
  command -v docker >/dev/null 2>&1 || fail "Docker Engine is required."
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required."
  docker info >/dev/null 2>&1 || fail "Docker is installed but unavailable."
}

confirm_update() {
  if [ "$ASSUME_YES" = true ]; then
    return
  fi

  printf 'Build and restart Orship now? [y/N] '
  read -r answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) info "Update cancelled."; exit 0 ;;
  esac
}

assert_compose_ownership() {
  local service container project
  for service in orship-api orship-web; do
    container="${CONTAINERS[$service]}"
    project="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$container")"
    [ "$project" = "codexsun-orship" ] || fail "Refusing to update $container because it is not owned by the codexsun-orship Compose project."
  done
}

verify_running_deployment() {
  command -v curl >/dev/null 2>&1 || fail "curl is required for post-update verification."
  curl --fail --silent --show-error http://127.0.0.1:6090/health/ready >/dev/null
  curl --fail --silent --show-error http://127.0.0.1:6090/api/orship/v1/docker/containers >/dev/null
}

rollback() {
  local result=$?
  if [ "$result" -eq 0 ] || [ "${UPDATE_STARTED:-false}" != true ]; then
    return "$result"
  fi

  warn "Update failed. Restoring the previous Orship images."
  set +e
  docker image tag "$PREVIOUS_API_IMAGE" "$API_IMAGE_REFERENCE"
  docker image tag "$PREVIOUS_WEB_IMAGE" "$WEB_IMAGE_REFERENCE"
  "${COMPOSE[@]}" up -d --no-build --force-recreate --wait --wait-timeout 120 orship-api orship-web
  if verify_running_deployment; then
    warn "The previous Orship deployment is running again."
  else
    warn "Rollback could not be verified. Inspect the service logs below."
  fi
  "${COMPOSE[@]}" logs --tail 100 orship-api orship-web >&2
  exit "$result"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --yes) ASSUME_YES=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    --no-cache) NO_CACHE=true ;;
    --help|-h) usage; exit 0 ;;
    *) fail "Unknown option: $1. Run bash ./update.sh --help." ;;
  esac
  shift
done

cd "$ROOT_DIR"
acquire_lock
require_docker

info "Checking Orship Compose configuration"
"${COMPOSE[@]}" config --quiet
ok "Compose configuration is valid"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "The Orship update command must run from a Git checkout."
SOURCE_COMMIT="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ] && [ "$ALLOW_DIRTY" != true ]; then
  fail "The Git worktree is dirty. Commit or stash unrelated changes, or explicitly use --allow-dirty."
fi
if [ -n "$(git status --porcelain)" ]; then
  warn "Building from a dirty worktree at commit $SOURCE_COMMIT."
else
  ok "Using clean source at commit $SOURCE_COMMIT"
fi

declare -A CONTAINERS
for service in orship-api orship-web; do
  container="$("${COMPOSE[@]}" ps -q "$service")"
  [ -n "$container" ] || fail "Orship service $service is not running. Run bash ./.container/orship/setup.sh first."
  CONTAINERS[$service]="$container"
done
assert_compose_ownership
ok "Existing Orship containers are owned by this Compose deployment"

if [ "$CHECK_ONLY" = true ]; then
  ok "Preflight passed. No images were built and no containers were restarted."
  exit 0
fi

PREVIOUS_API_IMAGE="$(docker inspect --format '{{.Image}}' "${CONTAINERS[orship-api]}")"
PREVIOUS_WEB_IMAGE="$(docker inspect --format '{{.Image}}' "${CONTAINERS[orship-web]}")"
API_IMAGE_REFERENCE="$(docker inspect --format '{{.Config.Image}}' "${CONTAINERS[orship-api]}")"
WEB_IMAGE_REFERENCE="$(docker inspect --format '{{.Config.Image}}' "${CONTAINERS[orship-web]}")"

info "Update plan: rebuild Orship API and web, preserve the orship-storage volume, then verify API readiness."
info "This command does not pull Git source or modify containers outside codexsun-orship."
confirm_update

UPDATE_STARTED=true
trap rollback ERR
BUILD_OPTIONS=()
if [ "$NO_CACHE" = true ]; then
  BUILD_OPTIONS+=(--no-cache)
fi

info "Building Orship images"
"${COMPOSE[@]}" build "${BUILD_OPTIONS[@]}"
info "Restarting Orship containers"
"${COMPOSE[@]}" up -d --no-build --force-recreate --wait --wait-timeout 120 orship-api orship-web
info "Verifying Orship API and Docker workload access"
verify_running_deployment
"${COMPOSE[@]}" ps
ok "Orship was updated successfully from source commit $SOURCE_COMMIT."
