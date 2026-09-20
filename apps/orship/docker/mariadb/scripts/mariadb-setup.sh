#!/bin/sh
set -eu

usage() {
  printf 'Usage: %s <build|install|start|stop|restart|status|logs|health|backup|restore|backup-loop|drop|purge|reinstall> <env-file> [backup-file]\n' "$0" >&2
}

command_name="${1:-}"
env_file="${2:-}"
backup_file="${3:-}"

if [ -z "$command_name" ] || [ -z "$env_file" ]; then
  usage
  exit 2
fi

if [ ! -f "$env_file" ]; then
  printf 'Environment file not found: %s\n' "$env_file" >&2
  exit 2
fi

. "$env_file"

: "${MARIADB_NAME:?MARIADB_NAME is required}"
: "${MARIADB_IMAGE:?MARIADB_IMAGE is required}"
: "${MARIADB_VERSION:?MARIADB_VERSION is required}"
: "${MARIADB_NETWORK:?MARIADB_NETWORK is required}"
: "${MARIADB_BIND_ADDRESS:?MARIADB_BIND_ADDRESS is required}"
: "${MARIADB_HOST_PORT:?MARIADB_HOST_PORT is required}"
: "${MARIADB_CONTAINER_PORT:?MARIADB_CONTAINER_PORT is required}"
: "${MARIADB_ROOT_PASSWORD:?MARIADB_ROOT_PASSWORD is required}"
: "${MARIADB_DATABASE:?MARIADB_DATABASE is required}"
: "${MARIADB_DATA_VOLUME:?MARIADB_DATA_VOLUME is required}"
: "${MARIADB_BACKUP_VOLUME:?MARIADB_BACKUP_VOLUME is required}"
: "${MARIADB_RESTART_POLICY:?MARIADB_RESTART_POLICY is required}"
: "${MARIADB_BACKUP_DIR:=./backups}"
: "${MARIADB_BACKUP_RETENTION_DAYS:=14}"
: "${MARIADB_BACKUP_INTERVAL_SECONDS:=86400}"

root_dir="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"

require_docker() {
  command -v docker >/dev/null 2>&1 || { printf 'Docker is required.\n' >&2; exit 1; }
  docker info >/dev/null
}

ensure_network() {
  docker network inspect "$MARIADB_NETWORK" >/dev/null 2>&1 || docker network create "$MARIADB_NETWORK" >/dev/null
}

build() {
  require_docker
  docker build --build-arg "MARIADB_VERSION=$MARIADB_VERSION" -t "$MARIADB_IMAGE" "$root_dir"
}

install() {
  require_docker
  ensure_network
  docker volume create "$MARIADB_DATA_VOLUME" >/dev/null
  docker volume create "$MARIADB_BACKUP_VOLUME" >/dev/null
  if docker container inspect "$MARIADB_NAME" >/dev/null 2>&1; then
    printf 'Container already exists: %s\n' "$MARIADB_NAME" >&2
    exit 1
  fi
  docker run -d --name "$MARIADB_NAME" --network "$MARIADB_NETWORK" \
    --restart "$MARIADB_RESTART_POLICY" \
    -e "MARIADB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD" \
    -e 'MARIADB_ROOT_HOST=%' \
    -e "MARIADB_DATABASE=$MARIADB_DATABASE" \
    -p "$MARIADB_BIND_ADDRESS:$MARIADB_HOST_PORT:$MARIADB_CONTAINER_PORT" \
    -v "$MARIADB_DATA_VOLUME:/var/lib/mysql" \
    -v "$MARIADB_BACKUP_VOLUME:/backups" \
    "$MARIADB_IMAGE"
}

backup() {
  require_docker
  mkdir -p "$MARIADB_BACKUP_DIR"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output="${backup_file:-$MARIADB_BACKUP_DIR/${MARIADB_NAME}-$timestamp.sql.gz}"
  umask 077
  docker exec "$MARIADB_NAME" mariadb-dump -uroot "-p$MARIADB_ROOT_PASSWORD" \
    --all-databases --single-transaction --routines --events --triggers \
    | gzip > "$output"
  find "$MARIADB_BACKUP_DIR" -type f -name '*.sql.gz' -mtime "+$MARIADB_BACKUP_RETENTION_DAYS" -delete
  printf '%s\n' "$output"
}

restore() {
  require_docker
  if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
    printf 'Backup file is required.\n' >&2
    exit 2
  fi
  gzip -dc "$backup_file" | docker exec -i "$MARIADB_NAME" mariadb -uroot "-p$MARIADB_ROOT_PASSWORD"
}

case "$command_name" in
  build) build ;;
  install) install ;;
  start|stop|restart) require_docker; docker "$command_name" "$MARIADB_NAME" ;;
  status) require_docker; docker inspect "$MARIADB_NAME" --format '{{json .State}}' ;;
  logs) require_docker; docker logs --tail 200 "$MARIADB_NAME" ;;
  health) require_docker; docker exec "$MARIADB_NAME" healthcheck.sh --connect --innodb_initialized ;;
  backup) backup ;;
  restore) restore ;;
  backup-loop) while true; do backup; sleep "$MARIADB_BACKUP_INTERVAL_SECONDS"; done ;;
  drop) require_docker; docker rm -f -v "$MARIADB_NAME" 2>/dev/null || true; docker volume rm "$MARIADB_DATA_VOLUME" 2>/dev/null || true ;;
  purge) "$0" drop "$env_file"; require_docker; docker volume rm "$MARIADB_BACKUP_VOLUME" 2>/dev/null || true ;;
  reinstall) "$0" drop "$env_file"; "$0" install "$env_file" ;;
  *) usage; exit 2 ;;
esac
