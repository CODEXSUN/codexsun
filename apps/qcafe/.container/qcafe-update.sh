#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${QCAFE_COMPOSE_PROJECT:-qcafe}"
no_cache=""

if [ "${1:-}" = "--no-cache" ] || [ "${QCAFE_UPDATE_NO_CACHE:-0}" = "1" ]; then
  no_cache="--no-cache"
fi

compose() {
  docker compose \
    --project-name "$project_name" \
    --env-file "$repository_root/.env" \
    --env-file "$repository_root/apps/qcafe/api/.app.env" \
    --file "$compose_file" \
    "$@"
}

command -v docker >/dev/null 2>&1 || {
  printf 'Docker is required to update Q Cafe containers.\n' >&2
  exit 1
}
docker info >/dev/null
docker compose version >/dev/null

if [ -n "$(compose ps -q api 2>/dev/null)" ]; then
  printf 'Stopping Q Cafe writers and backing up persistent data...\n'
  compose stop web api
  sh "$script_dir/qcafe-backup.sh"
fi

printf 'Building the current Q Cafe repository state...\n'
if [ -n "$no_cache" ]; then
  compose build --pull --no-cache
else
  compose build --pull
fi

printf 'Applying serial migrations before production startup...\n'
compose --profile tools run --rm migrate
compose up -d --remove-orphans api web

sh "$script_dir/qcafe-verify.sh"
