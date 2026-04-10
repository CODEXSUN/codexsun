#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLIENTS_DIR="$SCRIPT_DIR/clients"

log() {
  printf '%s\n' "$*"
}

die() {
  log "$*"
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "Missing required command: $1"
  fi
}

normalize_env_prefix() {
  printf '%s' "$1" | tr '[:lower:]-.' '[:upper:]__'
}

parse_compose_container_name() {
  local compose_file="$1"
  awk '/^[[:space:]]*container_name:[[:space:]]*/ { print $2; exit }' "$compose_file"
}

parse_compose_public_port() {
  local compose_file="$1"
  awk '
    /^[[:space:]]*-[[:space:]]*"/ {
      line=$0
      gsub(/"/, "", line)
      gsub(/^[[:space:]]*-[[:space:]]*/, "", line)
      split(line, parts, ":")
      if (length(parts) >= 2) {
        print parts[1]
        exit
      }
    }
  ' "$compose_file"
}

AVAILABLE_CLIENTS=()
SELECTED_CLIENTS=()

discover_clients() {
  AVAILABLE_CLIENTS=()

  local client_dir
  for client_dir in "$CLIENTS_DIR"/*; do
    [ -d "$client_dir" ] || continue
    [ -f "$client_dir/docker-compose.yml" ] || continue
    AVAILABLE_CLIENTS+=("$(basename "$client_dir")")
  done

  if [ "${#AVAILABLE_CLIENTS[@]}" -eq 0 ]; then
    die "No client compose folders were found under $CLIENTS_DIR"
  fi
}

show_help() {
  cat <<EOF
Dynamic client deploy setup

Usage:
  ./.container/setup.sh
  CLIENTS=codexsun ./.container/setup.sh
  CLIENTS=codexsun,tmnext_in TARGET_ENV=cloud ./.container/setup.sh
  TARGET_ENV=local CLIENTS=codexsun ./.container/setup.sh

Environment:
  TARGET_ENV=local|cloud      Default: cloud
  CLIENTS=all|client1,client2 Default: all discovered clients
  START_MARIADB=true|false    Default: false
  BUILD_IMAGE=true|false      Default: true
  CREATE_DATABASES=true|false Default: true
  CLEAN_INSTALL=true|false    Default: false

Available clients:
$(printf '  - %s\n' "${AVAILABLE_CLIENTS[@]}")
EOF
}

parse_selected_clients() {
  SELECTED_CLIENTS=()

  local input="${CLIENTS:-all}"
  if [ "$#" -gt 0 ]; then
    input="$*"
  fi

  if [ "$input" = "all" ]; then
    SELECTED_CLIENTS=("${AVAILABLE_CLIENTS[@]}")
    return
  fi

  local candidate found
  while IFS= read -r candidate; do
    [ -n "$candidate" ] || continue
    found="false"

    local known
    for known in "${AVAILABLE_CLIENTS[@]}"; do
      if [ "$known" = "$candidate" ]; then
        found="true"
        break
      fi
    done

    if [ "$found" != "true" ]; then
      die "Unknown client: $candidate"
    fi

    SELECTED_CLIENTS+=("$candidate")
  done < <(printf '%s' "$input" | tr ', ' '\n')

  if [ "${#SELECTED_CLIENTS[@]}" -eq 0 ]; then
    die "No clients selected. Use CLIENTS=all or CLIENTS=codexsun,tmnext_in"
  fi
}

discover_clients

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  show_help
  exit 0
fi

parse_selected_clients "$@"

TARGET_ENV="${TARGET_ENV:-cloud}"
case "$TARGET_ENV" in
  local|cloud) ;;
  *)
    die "TARGET_ENV must be 'local' or 'cloud'."
    ;;
esac

NETWORK_NAME="codexion-network"
IMAGE_TAG="codexsun-app:v1"

START_MARIADB="${START_MARIADB:-false}"
BUILD_IMAGE="${BUILD_IMAGE:-true}"
CREATE_DATABASES="${CREATE_DATABASES:-true}"
CLEAN_INSTALL="${CLEAN_INSTALL:-false}"
REMOVE_IMAGE="${REMOVE_IMAGE:-false}"
PRUNE_DOCKER="${PRUNE_DOCKER:-false}"
DROP_DATABASES="${DROP_DATABASES:-false}"
CONFIRM_DROP_DATABASES="${CONFIRM_DROP_DATABASES:-}"
ALLOW_MISSING_COMPOSE="${ALLOW_MISSING_COMPOSE:-false}"

GIT_SYNC_ENABLED="${GIT_SYNC_ENABLED:-true}"
GIT_AUTO_UPDATE_ON_START="${GIT_AUTO_UPDATE_ON_START:-false}"
GIT_FORCE_UPDATE_ON_START="${GIT_FORCE_UPDATE_ON_START:-true}"
GIT_REPOSITORY_URL="${GIT_REPOSITORY_URL:-https://github.com/CODEXSUN/codexsun.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
INSTALL_DEPS_ON_START="${INSTALL_DEPS_ON_START:-false}"
BUILD_ON_START="${BUILD_ON_START:-false}"
RUNTIME_FRONTEND_TARGET="${RUNTIME_FRONTEND_TARGET:-shop}"
RUNTIME_DB_BACKUP_ENABLED="${RUNTIME_DB_BACKUP_ENABLED:-false}"
RUNTIME_SECRETS_LAST_ROTATED_AT="${RUNTIME_SECRETS_LAST_ROTATED_AT:-$(date -u +%F)}"
RUNTIME_SQLITE_FILE="${RUNTIME_SQLITE_FILE:-storage/desktop/codexsun.sqlite}"

if [ "$TARGET_ENV" = "local" ]; then
  DEFAULT_RUNTIME_APP_ENV="development"
  DEFAULT_RUNTIME_PUBLIC_SCHEME="http"
  DEFAULT_RUNTIME_CLOUDFLARE_ENABLED="false"
  DEFAULT_RUNTIME_DB_DRIVER="mariadb"
else
  DEFAULT_RUNTIME_APP_ENV="production"
  DEFAULT_RUNTIME_PUBLIC_SCHEME="https"
  DEFAULT_RUNTIME_CLOUDFLARE_ENABLED="true"
  DEFAULT_RUNTIME_DB_DRIVER="mariadb"
fi

RUNTIME_APP_ENV="${RUNTIME_APP_ENV:-$DEFAULT_RUNTIME_APP_ENV}"
RUNTIME_PUBLIC_SCHEME="${RUNTIME_PUBLIC_SCHEME:-$DEFAULT_RUNTIME_PUBLIC_SCHEME}"
RUNTIME_CLOUDFLARE_ENABLED="${RUNTIME_CLOUDFLARE_ENABLED:-$DEFAULT_RUNTIME_CLOUDFLARE_ENABLED}"
RUNTIME_DB_DRIVER="${RUNTIME_DB_DRIVER:-$DEFAULT_RUNTIME_DB_DRIVER}"
GLOBAL_RUNTIME_PUBLIC_PORT="${RUNTIME_PUBLIC_PORT:-}"

DB_HOST_DEFAULT="${DB_HOST_DEFAULT:-mariadb}"
DB_PORT_DEFAULT="${DB_PORT_DEFAULT:-3306}"
DB_USER_DEFAULT="${DB_USER_DEFAULT:-root}"
DB_PASSWORD_DEFAULT="${DB_PASSWORD_DEFAULT:-DbPass1@@}"

CURRENT_CLIENT_ID=""
CURRENT_CLIENT_NAME=""
CURRENT_CLIENT_ENV_PREFIX=""
CURRENT_COMPOSE_FILE=""
CURRENT_CONTAINER=""
CURRENT_DOMAIN=""
CURRENT_DB_HOST=""
CURRENT_DB_PORT=""
CURRENT_DB_USER=""
CURRENT_DB_PASSWORD=""
CURRENT_DB_NAME=""
CURRENT_PUBLIC_PORT=""

load_client_config() {
  local client_id="$1"
  local client_dir="$CLIENTS_DIR/$client_id"
  local compose_file="$client_dir/docker-compose.yml"
  local config_file="$client_dir/client.conf.sh"

  [ -f "$compose_file" ] || die "Missing compose file for client '$client_id': $compose_file"

  CLIENT_ID="$client_id"
  CLIENT_DISPLAY_NAME="$client_id"
  CLIENT_ENV_PREFIX="$(normalize_env_prefix "$client_id")"
  CLIENT_COMPOSE_FILE=".container/clients/$client_id/docker-compose.yml"
  CLIENT_CONTAINER="$(parse_compose_container_name "$compose_file")"
  CLIENT_DOMAIN_LOCAL="localhost"
  CLIENT_DOMAIN_CLOUD="localhost"
  CLIENT_DB_HOST_LOCAL="$DB_HOST_DEFAULT"
  CLIENT_DB_HOST_CLOUD="$DB_HOST_DEFAULT"
  CLIENT_DB_PORT_LOCAL="$DB_PORT_DEFAULT"
  CLIENT_DB_PORT_CLOUD="$DB_PORT_DEFAULT"
  CLIENT_DB_USER_LOCAL="$DB_USER_DEFAULT"
  CLIENT_DB_USER_CLOUD="$DB_USER_DEFAULT"
  CLIENT_DB_PASSWORD_LOCAL="$DB_PASSWORD_DEFAULT"
  CLIENT_DB_PASSWORD_CLOUD="$DB_PASSWORD_DEFAULT"
  CLIENT_DB_NAME_LOCAL="${client_id}_db"
  CLIENT_DB_NAME_CLOUD="${client_id}_db"
  CLIENT_PUBLIC_PORT_LOCAL="$(parse_compose_public_port "$compose_file")"
  CLIENT_PUBLIC_PORT_CLOUD="443"

  if [ -f "$config_file" ]; then
    # shellcheck disable=SC1090
    . "$config_file"
  fi

  CURRENT_CLIENT_ID="$CLIENT_ID"
  CURRENT_CLIENT_NAME="$CLIENT_DISPLAY_NAME"
  CURRENT_CLIENT_ENV_PREFIX="$CLIENT_ENV_PREFIX"
  CURRENT_COMPOSE_FILE="$CLIENT_COMPOSE_FILE"
  CURRENT_CONTAINER="$CLIENT_CONTAINER"

  local target_suffix
  target_suffix="$(printf '%s' "$TARGET_ENV" | tr '[:lower:]' '[:upper:]')"

  local domain_default db_host_default db_port_default db_user_default db_password_default db_name_default public_port_default
  domain_default="${!CLIENT_DOMAIN_${target_suffix}:-}"
  db_host_default="${!CLIENT_DB_HOST_${target_suffix}:-}"
  db_port_default="${!CLIENT_DB_PORT_${target_suffix}:-}"
  db_user_default="${!CLIENT_DB_USER_${target_suffix}:-}"
  db_password_default="${!CLIENT_DB_PASSWORD_${target_suffix}:-}"
  db_name_default="${!CLIENT_DB_NAME_${target_suffix}:-}"
  public_port_default="${!CLIENT_PUBLIC_PORT_${target_suffix}:-}"

  local override_var value

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DOMAIN"
  value="${!override_var:-$domain_default}"
  CURRENT_DOMAIN="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DB_HOST"
  value="${!override_var:-$db_host_default}"
  CURRENT_DB_HOST="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DB_PORT"
  value="${!override_var:-$db_port_default}"
  CURRENT_DB_PORT="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DB_USER"
  value="${!override_var:-$db_user_default}"
  CURRENT_DB_USER="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DB_PASSWORD"
  value="${!override_var:-$db_password_default}"
  CURRENT_DB_PASSWORD="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_DB_NAME"
  value="${!override_var:-$db_name_default}"
  CURRENT_DB_NAME="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_PUBLIC_PORT"
  value="${!override_var:-${GLOBAL_RUNTIME_PUBLIC_PORT:-$public_port_default}}"
  CURRENT_PUBLIC_PORT="$value"
}

require_cmd docker

if ! docker info >/dev/null 2>&1; then
  die "Docker is not running or not accessible."
fi

COMPOSE_CMD=()
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  die "Docker Compose is not available. Install docker compose plugin or docker-compose."
fi

ensure_network() {
  if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    return
  fi

  log "Creating network: $NETWORK_NAME"
  docker network create "$NETWORK_NAME"
}

start_mariadb() {
  log "Starting MariaDB..."
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

  die "Timed out waiting for MariaDB to become ready."
}

clean_install() {
  log "Stopping selected client stacks and removing volumes..."

  local client_id
  for client_id in "${SELECTED_CLIENTS[@]}"; do
    load_client_config "$client_id"

    if [ -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" ]; then
      "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" down --remove-orphans -v || true
    fi

    docker rm -f "$CURRENT_CONTAINER" >/dev/null 2>&1 || true
  done

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

  die "Cannot create database '$db_name' automatically (mysql client not found)."
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

  die "Cannot drop database '$db_name' automatically (mysql client not found)."
}

ensure_databases() {
  if [ "$CREATE_DATABASES" != "true" ]; then
    return
  fi

  local client_id
  for client_id in "${SELECTED_CLIENTS[@]}"; do
    load_client_config "$client_id"
    ensure_database "$CURRENT_DB_HOST" "$CURRENT_DB_PORT" "$CURRENT_DB_USER" "$CURRENT_DB_PASSWORD" "$CURRENT_DB_NAME"
  done
}

drop_databases() {
  if [ "$DROP_DATABASES" != "true" ]; then
    return
  fi

  if [ "$CONFIRM_DROP_DATABASES" != "YES" ]; then
    die "DROP_DATABASES=true requires CONFIRM_DROP_DATABASES=YES to proceed."
  fi

  local client_id
  for client_id in "${SELECTED_CLIENTS[@]}"; do
    load_client_config "$client_id"
    drop_database "$CURRENT_DB_HOST" "$CURRENT_DB_PORT" "$CURRENT_DB_USER" "$CURRENT_DB_PASSWORD" "$CURRENT_DB_NAME"
  done
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

  die "Failed to update $key in $container runtime env."
}

configure_runtime_env() {
  local container="$1"
  local domain="$2"
  local db_host="$3"
  local db_port="$4"
  local db_user="$5"
  local db_password="$6"
  local db_name="$7"
  local public_port="$8"
  local public_scheme="$9"
  local secret_owner_email="${SECRET_OWNER_EMAIL:-security@${domain}}"
  local operations_owner_email="${OPERATIONS_OWNER_EMAIL:-ops@${domain}}"
  local public_base_url
  local public_port_suffix=""

  if [ -z "$domain" ]; then
    die "Missing domain for $container."
  fi

  if [ -z "$public_port" ]; then
    die "Missing public port for $container."
  fi

  if [ "$public_scheme" = "http" ] && [ "$public_port" != "80" ]; then
    public_port_suffix=":$public_port"
  fi
  if [ "$public_scheme" = "https" ] && [ "$public_port" != "443" ]; then
    public_port_suffix=":$public_port"
  fi
  public_base_url="${public_scheme}://${domain}${public_port_suffix}"

  update_env_value "$container" "APP_ENV" "$RUNTIME_APP_ENV"
  update_env_value "$container" "APP_HOST" "0.0.0.0"
  update_env_value "$container" "APP_DOMAIN" "$domain"
  update_env_value "$container" "APP_HTTP_PORT" "4000"
  update_env_value "$container" "FRONTEND_HOST" "0.0.0.0"
  update_env_value "$container" "FRONTEND_DOMAIN" "$domain"
  update_env_value "$container" "FRONTEND_HTTP_PORT" "$public_port"
  update_env_value "$container" "VITE_FRONTEND_TARGET" "$RUNTIME_FRONTEND_TARGET"
  update_env_value "$container" "CLOUDFLARE_ENABLED" "$RUNTIME_CLOUDFLARE_ENABLED"
  update_env_value "$container" "DB_DRIVER" "$RUNTIME_DB_DRIVER"
  update_env_value "$container" "SECRET_OWNER_EMAIL" "$secret_owner_email"
  update_env_value "$container" "OPERATIONS_OWNER_EMAIL" "$operations_owner_email"
  update_env_value "$container" "SECRETS_LAST_ROTATED_AT" "$RUNTIME_SECRETS_LAST_ROTATED_AT"
  update_env_value "$container" "CODEXSUN_API_URL" "$public_base_url"
  update_env_value "$container" "CODEXSUN_WEB_URL" "$public_base_url"
  update_env_value "$container" "PORT" "4000"
  update_env_value "$container" "SQLITE_FILE" "$RUNTIME_SQLITE_FILE"

  if [ "$RUNTIME_DB_DRIVER" = "sqlite" ]; then
    update_env_value "$container" "DB_HOST" ""
    update_env_value "$container" "DB_PORT" ""
    update_env_value "$container" "DB_USER" ""
    update_env_value "$container" "DB_PASSWORD" ""
    update_env_value "$container" "DB_NAME" ""
    update_env_value "$container" "DB_SSL" "false"
  else
    update_env_value "$container" "DB_HOST" "$db_host"
    update_env_value "$container" "DB_PORT" "$db_port"
    update_env_value "$container" "DB_USER" "$db_user"
    update_env_value "$container" "DB_PASSWORD" "$db_password"
    update_env_value "$container" "DB_NAME" "$db_name"
    update_env_value "$container" "DB_SSL" "false"
  fi
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

deploy_client() {
  local client_id="$1"
  load_client_config "$client_id"

  ensure_compose_file "$CURRENT_CLIENT_NAME" "$CURRENT_COMPOSE_FILE" || return 0

  log "Deploying ${CURRENT_CLIENT_NAME}..."
  "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" up -d

  wait_for_env_file "$CURRENT_CONTAINER"
  configure_runtime_env \
    "$CURRENT_CONTAINER" \
    "$CURRENT_DOMAIN" \
    "$CURRENT_DB_HOST" \
    "$CURRENT_DB_PORT" \
    "$CURRENT_DB_USER" \
    "$CURRENT_DB_PASSWORD" \
    "$CURRENT_DB_NAME" \
    "$CURRENT_PUBLIC_PORT" \
    "$RUNTIME_PUBLIC_SCHEME"

  log "Restarting ${CURRENT_CLIENT_NAME} container to apply runtime env..."
  docker restart "$CURRENT_CONTAINER" >/dev/null
}

ensure_compose_file() {
  local client_name="$1"
  local compose_file="$2"

  if [ -f "$REPO_ROOT/$compose_file" ]; then
    return 0
  fi

  if [ "$ALLOW_MISSING_COMPOSE" = "true" ]; then
    log "Skipping ${client_name}: missing $compose_file."
    return 1
  fi

  die "Missing compose file: $compose_file"
}

log "Selected clients: $(printf '%s ' "${SELECTED_CLIENTS[@]}" | sed 's/[[:space:]]*$//')"
log "Target environment: $TARGET_ENV"

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

for client_id in "${SELECTED_CLIENTS[@]}"; do
  deploy_client "$client_id"
done

log "Selected client deployment complete."
