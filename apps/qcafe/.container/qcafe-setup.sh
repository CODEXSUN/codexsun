#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${QCAFE_COMPOSE_PROJECT:-qcafe}"

require_file() {
  [ -r "$1" ] || {
    printf 'Required environment file is unavailable: %s\n' "$1" >&2
    exit 1
  }
}

compose() {
  docker compose \
    --project-name "$project_name" \
    --env-file "$repository_root/.env" \
    --env-file "$repository_root/apps/qcafe/api/.app.env" \
    --file "$compose_file" \
    "$@"
}

command -v docker >/dev/null 2>&1 || {
  printf 'Docker is required to set up Q Cafe containers.\n' >&2
  exit 1
}
docker info >/dev/null
docker compose version >/dev/null
require_file "$repository_root/.env"
require_file "$repository_root/apps/qcafe/api/.app.env"

printf 'Building Q Cafe API and web images...\n'
compose build

printf 'Preparing the SQLite and identity databases...\n'
compose --profile tools run --rm migrate

printf 'Starting Q Cafe API and web containers...\n'
compose up -d --remove-orphans api web

sh "$script_dir/qcafe-verify.sh"
