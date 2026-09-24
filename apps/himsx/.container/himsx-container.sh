#!/usr/bin/env sh
set -eu

action="${1:-}"
script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${HIMSX_COMPOSE_PROJECT:-himsx}"
api_port="${HIMSX_API_PUBLISHED_PORT:-6240}"
web_port="${HIMSX_WEB_PUBLISHED_PORT:-6241}"
storage_path="$repository_root/storage/apps/himsx"

compose() {
  docker compose --project-name "$project_name" --env-file "$repository_root/.env" --env-file "$repository_root/apps/himsx/api/.app.env" --file "$compose_file" "$@"
}

require_runtime() {
  command -v docker >/dev/null 2>&1 || { printf 'Docker is required to manage HIMSX containers.\n' >&2; exit 1; }
  docker info >/dev/null
  docker compose version >/dev/null
}

require_environment() {
  [ -r "$repository_root/.env" ] || { printf 'Required environment file is unavailable: %s\n' "$repository_root/.env" >&2; exit 1; }
  [ -r "$repository_root/apps/himsx/api/.app.env" ] || { printf 'Required environment file is unavailable: %s\n' "$repository_root/apps/himsx/api/.app.env" >&2; exit 1; }
}

wait_for_service() {
  service="$1"
  attempts=0
  while [ "$attempts" -lt 45 ]; do
    container_id="$(compose ps -q "$service")"
    if [ -n "$container_id" ]; then
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
      [ "$health" = "healthy" ] && return 0
    fi
    attempts=$((attempts + 1))
    sleep 2
  done
  compose logs --tail 80 "$service" >&2 || true
  printf 'HIMSX service did not become healthy: %s\n' "$service" >&2
  return 1
}

identity_counts() {
  compose exec -T api node -e '
    const { DatabaseSync } = require("node:sqlite");
    const database = new DatabaseSync("/workspace/storage/apps/himsx/private/data/himsx_db.sqlite", { readOnly: true });
    const migrations = database.prepare("SELECT COUNT(*) AS count FROM identity_migration_state").get().count;
    const users = database.prepare("SELECT COUNT(*) AS count FROM identity_users").get().count;
    database.close();
    process.stdout.write(`${migrations}:${users}`);
  '
}

verify() {
  wait_for_service api
  wait_for_service web
  compose exec -T api node -e "fetch('http://127.0.0.1:6240/api/v1/himsx/health').then(async response=>{const body=await response.json();if(!response.ok||body.status!=='ok')process.exit(1)}).catch(()=>process.exit(1))"
  compose exec -T web wget -qO- http://127.0.0.1/api/v1/himsx/health >/dev/null
  before="$(identity_counts)"
  migrations="${before%%:*}"
  users="${before##*:}"
  [ "$migrations" -gt 0 ] || { printf 'No HIMSX identity migration records were found.\n' >&2; exit 1; }
  [ "$users" -gt 0 ] || { printf 'No HIMSX identity users were found.\n' >&2; exit 1; }
  if [ "${2:-}" != "--no-restart" ]; then
    printf 'Restarting the HIMSX API to verify SQLite persistence...\n'
    compose restart api >/dev/null
    wait_for_service api
    after="$(identity_counts)"
    [ "$before" = "$after" ] || { printf 'HIMSX identity counts changed across restart: before=%s after=%s\n' "$before" "$after" >&2; exit 1; }
  fi
  printf 'HIMSX containers are healthy. SQLite migrations=%s identity users=%s.\n' "$migrations" "$users"
  printf 'Web: http://127.0.0.1:%s\nAPI: http://127.0.0.1:%s/api/v1/himsx/health\n' "$web_port" "$api_port"
  compose ps
}

backup() {
  archive="himsx-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
  compose --profile tools run --rm --no-deps -e "HIMSX_BACKUP_ARCHIVE=$archive" backup sh -eu -c 'tar -czf "/backups/$HIMSX_BACKUP_ARCHIVE" -C /workspace/storage .'
  printf 'HIMSX backup created in volume %s: %s\n' "${HIMSX_BACKUP_VOLUME:-himsx-backups}" "$archive"
}

drop() {
  if [ "${HIMSX_CONFIRM_DROP:-}" != "yes" ]; then
    if [ ! -t 0 ]; then
      printf 'Set HIMSX_CONFIRM_DROP=yes to delete HIMSX containers, SQLite data, backups, and local images.\n' >&2
      exit 1
    fi
    printf 'This deletes all containerized HIMSX data and backups. Type DROP HIMSX: '
    read -r answer
    [ "$answer" = "DROP HIMSX" ] || { printf 'Drop canceled.\n'; exit 1; }
  fi
  compose --profile tools down --volumes --remove-orphans --rmi local
  rm -rf "$storage_path"
  printf 'HIMSX containers, SQLite data, backups, and local images were removed.\n'
}

require_runtime
require_environment

case "$action" in
  setup)
    compose build
    compose --profile tools run --rm migrate
    compose up -d --remove-orphans api web
    verify verify
    ;;
  update)
    if [ -n "$(compose ps -q api 2>/dev/null)" ]; then compose stop web api; backup; fi
    if [ "${2:-}" = "--no-cache" ] || [ "${HIMSX_UPDATE_NO_CACHE:-0}" = "1" ]; then compose build --pull --no-cache; else compose build --pull; fi
    compose --profile tools run --rm migrate
    compose up -d --remove-orphans api web
    verify verify
    ;;
  backup) backup ;;
  verify) verify "$@" ;;
  drop) drop ;;
  *) printf 'Usage: %s {setup|update|backup|verify|drop} [--no-cache|--no-restart]\n' "$0" >&2; exit 2 ;;
esac
