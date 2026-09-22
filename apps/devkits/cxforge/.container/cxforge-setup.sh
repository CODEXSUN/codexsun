#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/compose.yml"
project_name="${CXFORGE_PROJECT_NAME:-cxforge}"
network_name="codexsun-network"
version="${CXFORGE_VERSION:-$(tr -d '\r\n' < "$repository_root/apps/devkits/cxforge/VERSION")}"

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

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

bootstrap_repository() {
  repository="${CXFORGE_BOOTSTRAP_REPOSITORY:-}"
  [ -n "$repository" ] || return 0
  require_command curl
  token_file="${CXFORGE_BOOTSTRAP_GIT_TOKEN_FILE:-}"
  [ -n "$token_file" ] && [ -r "$token_file" ] || {
    printf 'Set CXFORGE_BOOTSTRAP_GIT_TOKEN_FILE to a readable token file.\n' >&2
    return 1
  }

  client_key="${CXFORGE_ZUNO_CLIENT_KEY:-local-zuno-to-cxforge-client-key-32chars}"
  origin="http://127.0.0.1:${CXFORGE_API_PORT:-6400}"
  repositories="$(curl --fail --silent --show-error --header "X-CXForge-Client-Key: $client_key" "$origin/api/v1/cxforge/control/repositories")"
  if printf '%s' "$repositories" | grep -F "\"repository\":\"$(json_escape "$repository")\"" >/dev/null; then
    printf 'Repository workspace is already registered: %s\n' "$repository"
    return 0
  fi

  token="$(tr -d '\r\n' < "$token_file")"
  name="${CXFORGE_BOOTSTRAP_NAME:-Bootstrap repository}"
  provider="${CXFORGE_BOOTSTRAP_PROVIDER:-github}"
  username="${CXFORGE_BOOTSTRAP_USERNAME:-}"
  pattern="${CXFORGE_BOOTSTRAP_REPOSITORY_PATTERN:-$repository}"
  branch="${CXFORGE_BOOTSTRAP_BRANCH:-main}"
  push="${CXFORGE_BOOTSTRAP_PUSH:-false}"
  connection_payload="$(printf '{\"name\":\"%s\",\"provider\":\"%s\",\"username\":\"%s\",\"token\":\"%s\",\"repositoryPatterns\":[\"%s\"],\"permissions\":{\"clone\":true,\"pull\":true,\"push\":%s}}' "$(json_escape "$name")" "$(json_escape "$provider")" "$(json_escape "$username")" "$(json_escape "$token")" "$(json_escape "$pattern")" "$push")"
  connection="$(printf '%s' "$connection_payload" | curl --fail --silent --show-error --request POST --header "X-CXForge-Client-Key: $client_key" --header 'Content-Type: application/json' --data-binary @- "$origin/api/v1/cxforge/control/git-connections")"
  connection_id="$(printf '%s' "$connection" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
  [ -n "$connection_id" ] || {
    printf 'CXForge did not return a Git connection ID.\n' >&2
    return 1
  }

  repository_payload="$(printf '{\"name\":\"%s\",\"repository\":\"%s\",\"gitConnectionId\":\"%s\",\"defaultBranch\":\"%s\"}' "$(json_escape "$name")" "$(json_escape "$repository")" "$connection_id" "$(json_escape "$branch")")"
  if ! printf '%s' "$repository_payload" | curl --fail --silent --show-error --request POST --header "X-CXForge-Client-Key: $client_key" --header 'Content-Type: application/json' --data-binary @- "$origin/api/v1/cxforge/control/repositories" >/dev/null; then
    curl --silent --request DELETE --header "X-CXForge-Client-Key: $client_key" "$origin/api/v1/cxforge/control/git-connections/$connection_id" >/dev/null || true
    return 1
  fi
  token=""
  printf 'Repository workspace is ready: %s (%s)\n' "$repository" "$branch"
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
existing="$(docker compose -p "$project_name" -f "$compose_file" ps --all -q cxforge)"
if [ -n "$existing" ]; then
  docker start "$existing" >/dev/null
elif [ "${CXFORGE_NO_CACHE:-false}" = "true" ]; then
  docker compose -p "$project_name" -f "$compose_file" build --no-cache
  docker compose -p "$project_name" -f "$compose_file" up -d
elif [ "${CXFORGE_SKIP_BUILD:-false}" = "true" ]; then
  docker compose -p "$project_name" -f "$compose_file" up -d --no-build
else
  docker compose -p "$project_name" -f "$compose_file" up -d --build
fi

container_id="$(docker compose -p "$project_name" -f "$compose_file" ps -q cxforge)"
[ -n "$container_id" ] || {
  printf 'CXForge container was not created.\n' >&2
  exit 1
}
wait_for_health "$container_id"
bootstrap_repository
if [ -n "${CXFORGE_SETUP_RECIPE:-}" ]; then
  export CXFORGE_ZUNO_CLIENT_KEY="${CXFORGE_ZUNO_CLIENT_KEY:-local-zuno-to-cxforge-client-key-32chars}"
  export CXFORGE_API_ORIGIN="http://127.0.0.1:${CXFORGE_API_PORT:-6400}"
  sh "$script_dir/cxforge-workspace.sh" "$CXFORGE_SETUP_RECIPE"
fi

short_id="$(docker inspect --format '{{.Id}}' "$container_id" | cut -c1-12)"
printf 'CXForge %s is healthy.\n' "$version"
printf 'Container: %s (%s)\n' "${CXFORGE_CONTAINER_NAME:-cxforge}" "$short_id"
printf 'API: http://127.0.0.1:%s\n' "${CXFORGE_API_PORT:-6400}"
printf 'Preview: http://127.0.0.1:%s\n' "${CXFORGE_PREVIEW_PORT_1:-7300}"
