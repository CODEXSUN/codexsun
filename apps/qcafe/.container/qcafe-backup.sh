#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${QCAFE_COMPOSE_PROJECT:-qcafe}"
archive="qcafe-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"

compose() {
  docker compose \
    --project-name "$project_name" \
    --env-file "$repository_root/.env" \
    --env-file "$repository_root/apps/qcafe/api/.app.env" \
    --file "$compose_file" \
    "$@"
}

command -v docker >/dev/null 2>&1 || {
  printf 'Docker is required to back up Q Cafe.\n' >&2
  exit 1
}
docker info >/dev/null

compose --profile tools run --rm --no-deps \
  -e "QCAFE_BACKUP_ARCHIVE=$archive" \
  backup sh -eu -c 'tar -czf "/backups/$QCAFE_BACKUP_ARCHIVE" -C /workspace/storage .'

printf 'Q Cafe backup created in volume %s: %s\n' "${QCAFE_BACKUP_VOLUME:-qcafe-backups}" "$archive"
