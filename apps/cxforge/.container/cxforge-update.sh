#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH= cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/compose.yml"
project_name="cxforgefresh"
network_name="codexsun-network"

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
  printf 'Updated CXForge did not become healthy.\n' >&2
  return 1
}

require_command docker
require_command git
docker info >/dev/null
docker compose version >/dev/null
docker network inspect "$network_name" >/dev/null 2>&1 || {
  printf 'Docker network %s is unavailable. Run cxforge-setup.sh first.\n' "$network_name" >&2
  exit 1
}

git_root="$(git -C "$repository_root" rev-parse --show-toplevel)"
[ "$(CDPATH= cd -- "$git_root" && pwd)" = "$repository_root" ] || {
  printf 'The script is outside the expected Git repository.\n' >&2
  exit 1
}

base_version="$(tr -d '\r\n' < "$repository_root/apps/cxforge/VERSION")"
revision="$(git -C "$repository_root" rev-parse --short=12 HEAD)"
dirty_suffix=""
[ -z "$(git -C "$repository_root" status --porcelain -- apps/cxforge)" ] || dirty_suffix="-dirty"
version="${base_version}-${revision}${dirty_suffix}"

export CXFORGE_VERSION="$version"
docker compose -p "$project_name" -f "$compose_file" build --pull
docker compose -p "$project_name" -f "$compose_file" up -d --force-recreate --remove-orphans

container_id="$(docker compose -p "$project_name" -f "$compose_file" ps -q cxforge)"
[ -n "$container_id" ] || {
  printf 'Updated CXForge container was not created.\n' >&2
  exit 1
}
wait_for_health "$container_id"

short_id="$(docker inspect --format '{{.Id}}' "$container_id" | cut -c1-12)"
printf 'CXForge update is healthy.\n'
printf 'Version: %s\n' "$version"
printf 'Container: cxforge (%s)\n' "$short_id"
