#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log() {
  printf '%s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

require_cmd docker

if ! docker info >/dev/null 2>&1; then
  log "Docker is not running or not accessible."
  exit 1
fi

COMPOSE_CMD=()
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  log "Docker Compose is not available. Install docker compose plugin or docker-compose."
  exit 1
fi

NETWORK_NAME="codexion-network"
IMAGE_TAG="codexsun-app:v1"

# Global defaults (override by exporting before running).
START_MARIADB="${START_MARIADB:-false}"
BUILD_IMAGE="${BUILD_IMAGE:-true}"
CREATE_DATABASES="${CREATE_DATABASES:-true}"
CLEAN_INSTALL="${CLEAN_INSTALL:-false}"
REMOVE_IMAGE="${REMOVE_IMAGE:-false}"
PRUNE_DOCKER="${PRUNE_DOCKER:-false}"
DROP_DATABASES="${DROP_DATABASES:-false}"
CONFIRM_DROP_DATABASES="${CONFIRM_DROP_DATABASES:-}"
ALLOW_MISSING_COMPOSE="${ALLOW_MISSING_COMPOSE:-false}"

DEPLOY_CODEXSUN="${DEPLOY_CODEXSUN:-true}"
DEPLOY_TMNEXT="${DEPLOY_TMNEXT:-true}"
DEPLOY_TIRUPUR="${DEPLOY_TIRUPUR:-true}"
GIT_SYNC_ENABLED="${GIT_SYNC_ENABLED:-false}"
GIT_AUTO_UPDATE_ON_START="${GIT_AUTO_UPDATE_ON_START:-false}"
GIT_FORCE_UPDATE_ON_START="${GIT_FORCE_UPDATE_ON_START:-false}"
GIT_REPOSITORY_URL="${GIT_REPOSITORY_URL:-https://github.com/CODEXSUN/codexsun.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
INSTALL_DEPS_ON_START="${INSTALL_DEPS_ON_START:-false}"
BUILD_ON_START="${BUILD_ON_START:-false}"
RUNTIME_APP_ENV="${RUNTIME_APP_ENV:-production}"
RUNTIME_FRONTEND_TARGET="${RUNTIME_FRONTEND_TARGET:-shop}"
RUNTIME_CLOUDFLARE_ENABLED="${RUNTIME_CLOUDFLARE_ENABLED:-true}"
RUNTIME_DB_BACKUP_ENABLED="${RUNTIME_DB_BACKUP_ENABLED:-false}"
RUNTIME_SECRETS_LAST_ROTATED_AT="${RUNTIME_SECRETS_LAST_ROTATED_AT:-$(date -u +%F)}"

# Database defaults (override per-site below or via env).
DB_HOST_DEFAULT="${DB_HOST_DEFAULT:-mariadb}"
DB_PORT_DEFAULT="${DB_PORT_DEFAULT:-3306}"
DB_USER_DEFAULT="${DB_USER_DEFAULT:-root}"
DB_PASSWORD_DEFAULT="${DB_PASSWORD_DEFAULT:-DbPass1@@}"

# Site configuration: fill these before running on production.
CODEXSUN_DOMAIN="${CODEXSUN_DOMAIN:-codexsun.com}"
TMNEXT_DOMAIN="${TMNEXT_DOMAIN:-tmnext.in}"
TIRUPUR_DOMAIN="${TIRUPUR_DOMAIN:-tirupurdirect.com}"

CODEXSUN_DB_NAME="${CODEXSUN_DB_NAME:-codexsun_com_db}"
TMNEXT_DB_NAME="${TMNEXT_DB_NAME:-tmnext_in_db}"
TIRUPUR_DB_NAME="${TIRUPUR_DB_NAME:-tirupurdirect_com_db}"

CODEXSUN_DB_HOST="${CODEXSUN_DB_HOST:-$DB_HOST_DEFAULT}"
TMNEXT_DB_HOST="${TMNEXT_DB_HOST:-$DB_HOST_DEFAULT}"
TIRUPUR_DB_HOST="${TIRUPUR_DB_HOST:-$DB_HOST_DEFAULT}"

CODEXSUN_DB_PORT="${CODEXSUN_DB_PORT:-$DB_PORT_DEFAULT}"
TMNEXT_DB_PORT="${TMNEXT_DB_PORT:-$DB_PORT_DEFAULT}"
TIRUPUR_DB_PORT="${TIRUPUR_DB_PORT:-$DB_PORT_DEFAULT}"

CODEXSUN_DB_USER="${CODEXSUN_DB_USER:-$DB_USER_DEFAULT}"
TMNEXT_DB_USER="${TMNEXT_DB_USER:-$DB_USER_DEFAULT}"
TIRUPUR_DB_USER="${TIRUPUR_DB_USER:-$DB_USER_DEFAULT}"

CODEXSUN_DB_PASSWORD="${CODEXSUN_DB_PASSWORD:-$DB_PASSWORD_DEFAULT}"
TMNEXT_DB_PASSWORD="${TMNEXT_DB_PASSWORD:-$DB_PASSWORD_DEFAULT}"
TIRUPUR_DB_PASSWORD="${TIRUPUR_DB_PASSWORD:-$DB_PASSWORD_DEFAULT}"

CODEXSUN_COMPOSE_FILE="${CODEXSUN_COMPOSE_FILE:-.container/clients/codexsun/docker-compose.yml}"
TMNEXT_COMPOSE_FILE="${TMNEXT_COMPOSE_FILE:-.container/clients/tmnext_in/docker-compose.yml}"
TIRUPUR_COMPOSE_FILE="${TIRUPUR_COMPOSE_FILE:-.container/clients/tirupur_direct/docker-compose.yml}"

CODEXSUN_CONTAINER="${CODEXSUN_CONTAINER:-codexsun-app}"
TMNEXT_CONTAINER="${TMNEXT_CONTAINER:-tmnext-in-app}"
TIRUPUR_CONTAINER="${TIRUPUR_CONTAINER:-tirupur-direct-app}"

ensure_network() {
  if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    return
  fi

  log "Creating network: $NETWORK_NAME"
  docker network create "$NETWORK_NAME"
}

start_mariadb() {
  log "Starting MariaDB (optional)..."
  "${COMPOSE_CMD[@]}" -f "$SCRIPT_DIR/mariadb.yml" up -d
}

build_image() {
  log "Building image: $IMAGE_TAG"
  docker build -t "$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$REPO_ROOT"
}

wait_for_mariadb() {
  local db_user="$1"
  local db_password="$2"
  local attempts=60
  local delay=2

  if ! docker ps --format '{{.Names}}' | grep -qx "mariadb"; then
    return 0
  fi

  log "Waiting for MariaDB to accept connections..."

  for _ in $(seq 1 "$attempts"); do
    if docker exec mariadb mariadb-admin -u"$db_user" -p"$db_password" ping --silent >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done

  log "Timed out waiting for MariaDB to become ready."
  exit 1
}

clean_install() {
  log "Stopping existing stacks and removing volumes..."
  if [ -f "$REPO_ROOT/$CODEXSUN_COMPOSE_FILE" ]; then
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CODEXSUN_COMPOSE_FILE" down --remove-orphans -v || true
  fi
  if [ -f "$REPO_ROOT/$TMNEXT_COMPOSE_FILE" ]; then
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$TMNEXT_COMPOSE_FILE" down --remove-orphans -v || true
  fi
  if [ -f "$REPO_ROOT/$TIRUPUR_COMPOSE_FILE" ]; then
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$TIRUPUR_COMPOSE_FILE" down --remove-orphans -v || true
  fi

  docker rm -f "$CODEXSUN_CONTAINER" "$TMNEXT_CONTAINER" "$TIRUPUR_CONTAINER" >/dev/null 2>&1 || true

  if [ "$REMOVE_IMAGE" = "true" ]; then
    log "Removing image: $IMAGE_TAG"
    docker image rm "$IMAGE_TAG" >/dev/null 2>&1 || true
  fi

  if [ "$PRUNE_DOCKER" = "true" ]; then
    log "Pruning unused Docker resources..."
    docker system prune -f >/dev/null 2>&1 || true
    docker volume prune -f >/dev/null 2>&1 || true
    docker builder prune -f >/dev/null 2>&1 || true
  fi
}

escape_mysql_identifier() {
  local value="$1"
  value="${value//\`/\`\`}"
  printf '%s' "$value"
}

mysql_command_available() {
  command -v mariadb >/dev/null 2>&1 || command -v mysql >/dev/null 2>&1
}

ensure_database() {
  local db_host="$1"
  local db_port="$2"
  local db_user="$3"
  local db_password="$4"
  local db_name="$5"
  local safe_db

  safe_db="$(escape_mysql_identifier "$db_name")"

  if [ "$db_host" = "mariadb" ] && docker ps --format '{{.Names}}' | grep -qx "mariadb"; then
    log "Ensuring database exists in MariaDB container: $db_name"
    docker exec mariadb mariadb -u"$db_user" -p"$db_password" -e "CREATE DATABASE IF NOT EXISTS \`$safe_db\`;"
    return
  fi

  if mysql_command_available; then
    local mysql_cmd="mysql"
    if command -v mariadb >/dev/null 2>&1; then
      mysql_cmd="mariadb"
    fi

    log "Ensuring database exists on ${db_host}:${db_port}: $db_name"
    "$mysql_cmd" -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_password" -e "CREATE DATABASE IF NOT EXISTS \`$safe_db\`;"
    return
  fi

  log "Cannot create database '$db_name' automatically (mysql client not found)."
  log "Create it manually and rerun the setup."
  exit 1
}

drop_database() {
  local db_host="$1"
  local db_port="$2"
  local db_user="$3"
  local db_password="$4"
  local db_name="$5"
  local safe_db

  safe_db="$(escape_mysql_identifier "$db_name")"

  if [ "$db_host" = "mariadb" ] && docker ps --format '{{.Names}}' | grep -qx "mariadb"; then
    log "Dropping database in MariaDB container: $db_name"
    docker exec mariadb mariadb -u"$db_user" -p"$db_password" -e "DROP DATABASE IF EXISTS \`$safe_db\`;"
    return
  fi

  if mysql_command_available; then
    local mysql_cmd="mysql"
    if command -v mariadb >/dev/null 2>&1; then
      mysql_cmd="mariadb"
    fi

    log "Dropping database on ${db_host}:${db_port}: $db_name"
    "$mysql_cmd" -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_password" -e "DROP DATABASE IF EXISTS \`$safe_db\`;"
    return
  fi

  log "Cannot drop database '$db_name' automatically (mysql client not found)."
  exit 1
}

ensure_databases() {
  if [ "$CREATE_DATABASES" != "true" ]; then
    return
  fi

  if [ "$DEPLOY_CODEXSUN" = "true" ]; then
    ensure_database "$CODEXSUN_DB_HOST" "$CODEXSUN_DB_PORT" "$CODEXSUN_DB_USER" "$CODEXSUN_DB_PASSWORD" "$CODEXSUN_DB_NAME"
  fi
  if [ "$DEPLOY_TMNEXT" = "true" ]; then
    ensure_database "$TMNEXT_DB_HOST" "$TMNEXT_DB_PORT" "$TMNEXT_DB_USER" "$TMNEXT_DB_PASSWORD" "$TMNEXT_DB_NAME"
  fi
  if [ "$DEPLOY_TIRUPUR" = "true" ]; then
    ensure_database "$TIRUPUR_DB_HOST" "$TIRUPUR_DB_PORT" "$TIRUPUR_DB_USER" "$TIRUPUR_DB_PASSWORD" "$TIRUPUR_DB_NAME"
  fi
}

drop_databases() {
  if [ "$DROP_DATABASES" != "true" ]; then
    return
  fi

  if [ "$CONFIRM_DROP_DATABASES" != "YES" ]; then
    log "DROP_DATABASES=true requires CONFIRM_DROP_DATABASES=YES to proceed."
    exit 1
  fi

  if [ "$DEPLOY_CODEXSUN" = "true" ]; then
    drop_database "$CODEXSUN_DB_HOST" "$CODEXSUN_DB_PORT" "$CODEXSUN_DB_USER" "$CODEXSUN_DB_PASSWORD" "$CODEXSUN_DB_NAME"
  fi
  if [ "$DEPLOY_TMNEXT" = "true" ]; then
    drop_database "$TMNEXT_DB_HOST" "$TMNEXT_DB_PORT" "$TMNEXT_DB_USER" "$TMNEXT_DB_PASSWORD" "$TMNEXT_DB_NAME"
  fi
  if [ "$DEPLOY_TIRUPUR" = "true" ]; then
    drop_database "$TIRUPUR_DB_HOST" "$TIRUPUR_DB_PORT" "$TIRUPUR_DB_USER" "$TIRUPUR_DB_PASSWORD" "$TIRUPUR_DB_NAME"
  fi
}

wait_for_env_file() {
  local container="$1"
  local attempts=60
  local delay=2

  for _ in $(seq 1 "$attempts"); do
    if docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx "true" &&
      docker exec "$container" sh -c "test -f /opt/codexsun/runtime/.env" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done

  log "Timed out waiting for /opt/codexsun/runtime/.env in $container"
  return 1
}

update_env_value() {
  local container="$1"
  local key="$2"
  local value="$3"
  local key_b64 value_b64
  local runtime_volume

  key_b64=$(printf '%s' "$key" | base64 | tr -d '\n')
  value_b64=$(printf '%s' "$value" | base64 | tr -d '\n')

  runtime_volume="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/opt/codexsun/runtime"}}{{.Name}}{{end}}{{end}}' "$container" 2>/dev/null)"
  if [ -n "$runtime_volume" ]; then
    if docker run --rm -v "${runtime_volume}:/runtime" --entrypoint sh "$IMAGE_TAG" -c "
      envFile=/runtime/.env
      [ -f \"\$envFile\" ] || exit 1
      key=\$(printf '%s' '$key_b64' | base64 -d)
      value=\$(printf '%s' '$value_b64' | base64 -d)
      tmp=\$(mktemp)
      awk -v key=\"\$key\" -v value=\"\$value\" 'BEGIN{found=0} {if (\$0 ~ \"^\"key\"=\") {print key\"=\"value; found=1} else print} END {if (!found) print key\"=\"value}' \"\$envFile\" > \"\$tmp\"
      mv \"\$tmp\" \"\$envFile\"
    " >/dev/null 2>&1; then
      return 0
    fi
  fi

  for _ in $(seq 1 30); do
    if docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx "true" &&
      docker exec "$container" sh -c "
        envFile=/opt/codexsun/runtime/.env
        [ -f \"\$envFile\" ] || exit 1
        key=\$(printf '%s' '$key_b64' | base64 -d)
        value=\$(printf '%s' '$value_b64' | base64 -d)
        tmp=\$(mktemp)
        awk -v key=\"\$key\" -v value=\"\$value\" 'BEGIN{found=0} {if (\$0 ~ \"^\"key\"=\") {print key\"=\"value; found=1} else print} END {if (!found) print key\"=\"value}' \"\$envFile\" > \"\$tmp\"
        mv \"\$tmp\" \"\$envFile\"
      " >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  log "Failed to update $key in $container runtime env."
  exit 1
}

configure_runtime_env() {
  local container="$1"
  local domain="$2"
  local db_host="$3"
  local db_port="$4"
  local db_user="$5"
  local db_password="$6"
  local db_name="$7"
  local secret_owner_email="${SECRET_OWNER_EMAIL:-security@${domain}}"
  local operations_owner_email="${OPERATIONS_OWNER_EMAIL:-ops@${domain}}"

  if [ -z "$domain" ]; then
    log "Missing domain for $container. Set the domain variables at the top of setup.sh."
    exit 1
  fi

  update_env_value "$container" "APP_ENV" "$RUNTIME_APP_ENV"
  update_env_value "$container" "APP_HOST" "0.0.0.0"
  update_env_value "$container" "APP_DOMAIN" "$domain"
  update_env_value "$container" "APP_HTTP_PORT" "4000"
  update_env_value "$container" "FRONTEND_HOST" "0.0.0.0"
  update_env_value "$container" "FRONTEND_DOMAIN" "$domain"
  update_env_value "$container" "FRONTEND_HTTP_PORT" "443"
  update_env_value "$container" "VITE_FRONTEND_TARGET" "$RUNTIME_FRONTEND_TARGET"
  update_env_value "$container" "CLOUDFLARE_ENABLED" "$RUNTIME_CLOUDFLARE_ENABLED"
  update_env_value "$container" "DB_DRIVER" "mariadb"
  update_env_value "$container" "SECRET_OWNER_EMAIL" "$secret_owner_email"
  update_env_value "$container" "OPERATIONS_OWNER_EMAIL" "$operations_owner_email"
  update_env_value "$container" "SECRETS_LAST_ROTATED_AT" "$RUNTIME_SECRETS_LAST_ROTATED_AT"
  update_env_value "$container" "CODEXSUN_API_URL" "https://${domain}"
  update_env_value "$container" "CODEXSUN_WEB_URL" "https://${domain}"
  update_env_value "$container" "PORT" "4000"

  update_env_value "$container" "DB_HOST" "$db_host"
  update_env_value "$container" "DB_PORT" "$db_port"
  update_env_value "$container" "DB_USER" "$db_user"
  update_env_value "$container" "DB_PASSWORD" "$db_password"
  update_env_value "$container" "DB_NAME" "$db_name"
  update_env_value "$container" "DB_SSL" "false"
  update_env_value "$container" "DB_BACKUP_ENABLED" "$RUNTIME_DB_BACKUP_ENABLED"
  update_env_value "$container" "AUTH_OTP_DEBUG" "false"

  update_env_value "$container" "GIT_SYNC_ENABLED" "$GIT_SYNC_ENABLED"
  update_env_value "$container" "GIT_AUTO_UPDATE_ON_START" "$GIT_AUTO_UPDATE_ON_START"
  update_env_value "$container" "GIT_FORCE_UPDATE_ON_START" "$GIT_FORCE_UPDATE_ON_START"
  update_env_value "$container" "GIT_REPOSITORY_URL" "$GIT_REPOSITORY_URL"
  update_env_value "$container" "GIT_BRANCH" "$GIT_BRANCH"
  update_env_value "$container" "INSTALL_DEPS_ON_START" "$INSTALL_DEPS_ON_START"
  update_env_value "$container" "BUILD_ON_START" "$BUILD_ON_START"
}

deploy_site() {
  local name="$1"
  local compose_file="$2"
  local container="$3"
  local domain="$4"
  local db_host="$5"
  local db_port="$6"
  local db_user="$7"
  local db_password="$8"
  local db_name="$9"

  log "Deploying ${name}..."
  "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$compose_file" up -d

  wait_for_env_file "$container"
  configure_runtime_env "$container" "$domain" "$db_host" "$db_port" "$db_user" "$db_password" "$db_name"

  log "Restarting ${name} container to apply runtime env..."
  docker restart "$container" >/dev/null
}

ensure_compose_file() {
  local name="$1"
  local compose_file="$2"
  local name_upper

  if [ -f "$REPO_ROOT/$compose_file" ]; then
    return 0
  fi

  if [ "$ALLOW_MISSING_COMPOSE" = "true" ]; then
    log "Skipping ${name}: missing $compose_file."
    return 1
  fi

  name_upper="$(printf '%s' "$name" | tr '[:lower:]' '[:upper:]')"
  log "Missing compose file: $compose_file"
  log "Set DEPLOY_${name_upper}=false to skip or fix the path in setup.sh."
  exit 1
}

ensure_network

if [ "$START_MARIADB" = "true" ]; then
  start_mariadb
  wait_for_mariadb "$DB_USER_DEFAULT" "$DB_PASSWORD_DEFAULT"
fi

if [ "$CLEAN_INSTALL" = "true" ]; then
  clean_install
fi

if [ "$DROP_DATABASES" = "true" ]; then
  drop_databases
fi

if [ "$BUILD_IMAGE" = "true" ]; then
  build_image
fi

ensure_databases

if [ "$DEPLOY_CODEXSUN" = "true" ] && ensure_compose_file "codexsun" "$CODEXSUN_COMPOSE_FILE"; then
  deploy_site "codexsun" "$CODEXSUN_COMPOSE_FILE" "$CODEXSUN_CONTAINER" \
    "$CODEXSUN_DOMAIN" "$CODEXSUN_DB_HOST" "$CODEXSUN_DB_PORT" "$CODEXSUN_DB_USER" "$CODEXSUN_DB_PASSWORD" "$CODEXSUN_DB_NAME"
fi

if [ "$DEPLOY_TMNEXT" = "true" ] && ensure_compose_file "tmnext" "$TMNEXT_COMPOSE_FILE"; then
  deploy_site "tmnext.in" "$TMNEXT_COMPOSE_FILE" "$TMNEXT_CONTAINER" \
    "$TMNEXT_DOMAIN" "$TMNEXT_DB_HOST" "$TMNEXT_DB_PORT" "$TMNEXT_DB_USER" "$TMNEXT_DB_PASSWORD" "$TMNEXT_DB_NAME"
fi

if [ "$DEPLOY_TIRUPUR" = "true" ] && ensure_compose_file "tirupur" "$TIRUPUR_COMPOSE_FILE"; then
  deploy_site "tirupurdirect.in" "$TIRUPUR_COMPOSE_FILE" "$TIRUPUR_CONTAINER" \
    "$TIRUPUR_DOMAIN" "$TIRUPUR_DB_HOST" "$TIRUPUR_DB_PORT" "$TIRUPUR_DB_USER" "$TIRUPUR_DB_PASSWORD" "$TIRUPUR_DB_NAME"
fi

log "All sites deployed. Verify with /health on each domain via the reverse proxy."
