#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${QCAFE_COMPOSE_PROJECT:-qcafe}"

confirm_drop() {
  [ "${QCAFE_CONFIRM_DROP:-}" = "yes" ] && return 0
  if [ ! -t 0 ]; then
    printf 'Set QCAFE_CONFIRM_DROP=yes to delete Q Cafe containers, SQLite data, backups, and local images.\n' >&2
    return 1
  fi
  printf 'This deletes all containerized Q Cafe data and backups. Type DROP QCAFE: '
  read -r answer
  [ "$answer" = "DROP QCAFE" ] || {
    printf 'Drop canceled.\n'
    return 1
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
  printf 'Docker is required to drop Q Cafe containers.\n' >&2
  exit 1
}
docker info >/dev/null
docker compose version >/dev/null
confirm_drop

compose --profile tools down --volumes --remove-orphans --rmi local
printf 'Q Cafe containers, SQLite data, backups, and local images were removed.\n'
