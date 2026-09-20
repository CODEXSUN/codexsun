#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH= cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/compose.yml"
project_name="cxforgefresh"
network_name="codexsun-network"
version="$(tr -d '\r\n' < "$repository_root/apps/cxforge/VERSION")"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is unavailable: %s\n' "$1" >&2
    exit 1
  }
}

wait_for_health() {
  container_id="$1"
  attempts=0
  while [ "$attempts" -lt 30 ]; do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    [ "$health" = "healthy" ] && return 0
    attempts=$((attempts + 1))
    sleep 2
  done
  docker logs --tail 80 "$container_id" >&2 || true
  printf 'CXForge did not become healthy.\n' >&2
  return 1
}

require_command docker
docker info >/dev/null
docker compose version >/dev/null

if docker network inspect "$network_name" >/dev/null 2>&1; then
  printf 'Using Docker network: %s\n' "$network_name"
else
  docker network create --driver bridge "$network_name" >/dev/null
  printf 'Created Docker network: %s\n' "$network_name"
fi

export CXFORGE_VERSION="$version"
if [ "${CXFORGE_NO_CACHE:-false}" = "true" ]; then
  docker compose -p "$project_name" -f "$compose_file" build --no-cache
  docker compose -p "$project_name" -f "$compose_file" up -d
else
  docker compose -p "$project_name" -f "$compose_file" up -d --build
fi

container_id="$(docker compose -p "$project_name" -f "$compose_file" ps -q cxforge)"
[ -n "$container_id" ] || {
  printf 'CXForge container was not created.\n' >&2
  exit 1
}
wait_for_health "$container_id"

short_id="$(docker inspect --format '{{.Id}}' "$container_id" | cut -c1-12)"
printf 'CXForge %s is healthy.\n' "$version"
printf 'Container: cxforge (%s)\n' "$short_id"
printf 'API: http://127.0.0.1:6400\n'
printf 'Preview ports: 7300-7303\n'
