#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLIENTS_DIR="$CONTAINER_ROOT/clients"
CLIENT_LIST_FILE="$CONTAINER_ROOT/client-list.md"

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

  if [ -f "$CLIENT_LIST_FILE" ]; then
    local listed_clients=()
    local listed_client

    while IFS= read -r listed_client; do
      [ -n "$listed_client" ] || continue
      listed_clients+=("$listed_client")
    done < <(
      awk -F'|' '
        /^\|/ {
          client_id=$2
          gsub(/^[[:space:]]+|[[:space:]]+$/, "", client_id)
          if (client_id != "" && client_id != "client_id" && client_id != "---") {
            print client_id
          }
        }
      ' "$CLIENT_LIST_FILE"
    )

    if [ "${#listed_clients[@]}" -gt 0 ]; then
      for listed_client in "${listed_clients[@]}"; do
        [ -d "$CLIENTS_DIR/$listed_client" ] || die "Client '$listed_client' is listed in $CLIENT_LIST_FILE but missing under $CLIENTS_DIR"
        [ -f "$CLIENTS_DIR/$listed_client/docker-compose.yml" ] || die "Client '$listed_client' is listed in $CLIENT_LIST_FILE but missing docker-compose.yml"
        AVAILABLE_CLIENTS+=("$listed_client")
      done
    fi
  fi

  if [ "${#AVAILABLE_CLIENTS[@]}" -gt 0 ]; then
    return
  fi

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
  ./.container/bash-sh/setup.sh
  CLIENTS=codexsun ./.container/bash-sh/setup.sh
  CLIENTS=codexsun,tmnext_in TARGET_ENV=cloud ./.container/bash-sh/setup.sh
  TARGET_ENV=local CLIENTS=codexsun ./.container/bash-sh/setup.sh

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

  local normalized_input
  normalized_input="$(printf '%s' "$input" | tr ',' ' ')"

  local candidate found
  for candidate in $normalized_input; do
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
  done

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

if [ "$TARGET_ENV" = "local" ]; then
  DEFAULT_GIT_SYNC_ENABLED="false"
  DEFAULT_GIT_AUTO_UPDATE_ON_START="false"
  DEFAULT_GIT_FORCE_UPDATE_ON_START="false"
  DEFAULT_GIT_SCHEDULED_UPDATE_ENABLED="false"
  DEFAULT_GIT_SCHEDULED_UPDATE_AUTO_APPLY="false"
else
  DEFAULT_GIT_SYNC_ENABLED="true"
  DEFAULT_GIT_AUTO_UPDATE_ON_START="false"
  DEFAULT_GIT_FORCE_UPDATE_ON_START="false"
  DEFAULT_GIT_SCHEDULED_UPDATE_ENABLED="false"
  DEFAULT_GIT_SCHEDULED_UPDATE_AUTO_APPLY="false"
fi

GIT_SYNC_ENABLED="${GIT_SYNC_ENABLED:-$DEFAULT_GIT_SYNC_ENABLED}"
GIT_AUTO_UPDATE_ON_START="${GIT_AUTO_UPDATE_ON_START:-$DEFAULT_GIT_AUTO_UPDATE_ON_START}"
GIT_FORCE_UPDATE_ON_START="${GIT_FORCE_UPDATE_ON_START:-$DEFAULT_GIT_FORCE_UPDATE_ON_START}"
GIT_SCHEDULED_UPDATE_ENABLED="${GIT_SCHEDULED_UPDATE_ENABLED:-$DEFAULT_GIT_SCHEDULED_UPDATE_ENABLED}"
GIT_SCHEDULED_UPDATE_CADENCE_MINUTES="${GIT_SCHEDULED_UPDATE_CADENCE_MINUTES:-30}"
GIT_SCHEDULED_UPDATE_AUTO_APPLY="${GIT_SCHEDULED_UPDATE_AUTO_APPLY:-$DEFAULT_GIT_SCHEDULED_UPDATE_AUTO_APPLY}"
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
RUNTIME_TLS_ENABLED="${RUNTIME_TLS_ENABLED:-false}"
GLOBAL_RUNTIME_PUBLIC_PORT="${RUNTIME_PUBLIC_PORT:-}"

DB_HOST_DEFAULT="${DB_HOST_DEFAULT:-mariadb}"
DB_PORT_DEFAULT="${DB_PORT_DEFAULT:-3306}"
DB_USER_DEFAULT="${DB_USER_DEFAULT:-root}"
DB_PASSWORD_DEFAULT="${DB_PASSWORD_DEFAULT:-DbPass1@@}"
GLOBAL_APP_BIND_IP="${APP_BIND_IP:-}"
GLOBAL_APP_HTTP_HOST_PORT="${APP_HTTP_HOST_PORT:-}"
GLOBAL_APP_ALT_HTTP_HOST_PORT="${APP_ALT_HTTP_HOST_PORT:-}"

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
CURRENT_APP_BIND_IP=""
CURRENT_APP_HTTP_HOST_PORT=""
CURRENT_APP_ALT_HTTP_HOST_PORT=""

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
  CLIENT_DOMAIN_LOCAL="127.0.0.1"
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
  CLIENT_APP_BIND_IP_LOCAL="0.0.0.0"
  CLIENT_APP_BIND_IP_CLOUD="127.0.0.1"
  CLIENT_APP_HTTP_HOST_PORT_LOCAL=""
  CLIENT_APP_HTTP_HOST_PORT_CLOUD=""
  CLIENT_APP_ALT_HTTP_HOST_PORT_LOCAL=""
  CLIENT_APP_ALT_HTTP_HOST_PORT_CLOUD=""

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

  local domain_var db_host_var db_port_var db_user_var db_password_var db_name_var public_port_var
  local app_bind_ip_var app_http_host_port_var app_alt_http_host_port_var
  local domain_default db_host_default db_port_default db_user_default db_password_default db_name_default public_port_default
  local app_bind_ip_default app_http_host_port_default app_alt_http_host_port_default
  domain_var="CLIENT_DOMAIN_${target_suffix}"
  db_host_var="CLIENT_DB_HOST_${target_suffix}"
  db_port_var="CLIENT_DB_PORT_${target_suffix}"
  db_user_var="CLIENT_DB_USER_${target_suffix}"
  db_password_var="CLIENT_DB_PASSWORD_${target_suffix}"
  db_name_var="CLIENT_DB_NAME_${target_suffix}"
  public_port_var="CLIENT_PUBLIC_PORT_${target_suffix}"
  app_bind_ip_var="CLIENT_APP_BIND_IP_${target_suffix}"
  app_http_host_port_var="CLIENT_APP_HTTP_HOST_PORT_${target_suffix}"
  app_alt_http_host_port_var="CLIENT_APP_ALT_HTTP_HOST_PORT_${target_suffix}"

  domain_default="${!domain_var:-}"
  db_host_default="${!db_host_var:-}"
  db_port_default="${!db_port_var:-}"
  db_user_default="${!db_user_var:-}"
  db_password_default="${!db_password_var:-}"
  db_name_default="${!db_name_var:-}"
  public_port_default="${!public_port_var:-}"
  app_bind_ip_default="${!app_bind_ip_var:-}"
  app_http_host_port_default="${!app_http_host_port_var:-}"
  app_alt_http_host_port_default="${!app_alt_http_host_port_var:-}"

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

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_APP_BIND_IP"
  value="${!override_var:-${GLOBAL_APP_BIND_IP:-$app_bind_ip_default}}"
  CURRENT_APP_BIND_IP="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_APP_HTTP_HOST_PORT"
  value="${!override_var:-${GLOBAL_APP_HTTP_HOST_PORT:-$app_http_host_port_default}}"
  CURRENT_APP_HTTP_HOST_PORT="$value"

  override_var="${CURRENT_CLIENT_ENV_PREFIX}_APP_ALT_HTTP_HOST_PORT"
  value="${!override_var:-${GLOBAL_APP_ALT_HTTP_HOST_PORT:-$app_alt_http_host_port_default}}"
  CURRENT_APP_ALT_HTTP_HOST_PORT="$value"
}

set_compose_runtime_vars() {
  export APP_BIND_IP="${CURRENT_APP_BIND_IP:-}"
  export APP_HTTP_HOST_PORT="${CURRENT_APP_HTTP_HOST_PORT:-}"
  export APP_ALT_HTTP_HOST_PORT="${CURRENT_APP_ALT_HTTP_HOST_PORT:-}"
}

validate_cloud_runtime() {
  local client_name="$1"
  local domain="$2"
  local jwt_secret="${JWT_SECRET:-}"

  case "$domain" in
    ""|localhost|127.0.0.1|0.0.0.0|*.local|*.localhost)
      die "Cloud target for ${client_name} requires a real domain. Current value: ${domain:-<empty>}"
      ;;
  esac

  if [ "$RUNTIME_PUBLIC_SCHEME" != "https" ]; then
    die "Cloud target for ${client_name} requires RUNTIME_PUBLIC_SCHEME=https."
  fi

  if [ "${#jwt_secret}" -lt 16 ] ||
    [ "$jwt_secret" = "change-this-secret-to-at-least-16-characters" ] ||
    [ "$jwt_secret" = "codexsun-development-jwt-secret" ]; then
    die "Cloud target for ${client_name} requires JWT_SECRET with at least 16 non-default characters."
  fi
}

validate_selected_clients() {
  local client_id

  for client_id in "${SELECTED_CLIENTS[@]}"; do
    load_client_config "$client_id"

    if [ "$TARGET_ENV" = "cloud" ]; then
      validate_cloud_runtime "$CURRENT_CLIENT_NAME" "$CURRENT_DOMAIN"
    fi
  done
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
  "${COMPOSE_CMD[@]}" -f "$CONTAINER_ROOT/database/mariadb.yml" up -d
}

build_image() {
  local client_id

  for client_id in "${SELECTED_CLIENTS[@]}"; do
    load_client_config "$client_id"
    set_compose_runtime_vars
    ensure_compose_file "$CURRENT_CLIENT_NAME" "$CURRENT_COMPOSE_FILE" || continue
    log "Building image for ${CURRENT_CLIENT_NAME} via docker compose..."
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" build
  done
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

wait_for_app_ready() {
  local container="$1"
  local public_scheme="${2:-http}"
  local attempts="${3:-120}"
  local delay="${4:-2}"
  local fetch_command

  if [ "$public_scheme" = "https" ]; then
    fetch_command="fetch('http://127.0.0.1:4000/health', { headers: { 'x-forwarded-proto': 'https' } }).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
  else
    fetch_command="fetch('http://127.0.0.1:4000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
  fi

  log "Waiting for application health in $container..."

  for _ in $(seq 1 "$attempts"); do
    if docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx "true" &&
      docker exec "$container" node -e "$fetch_command" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done

  die "Timed out waiting for application health in $container."
}

format_public_url() {
  local domain="$1"
  local public_port="$2"
  local public_scheme="$3"
  local public_port_suffix=""

  if [ "$public_scheme" = "http" ] && [ "$public_port" != "80" ]; then
    public_port_suffix=":$public_port"
  fi
  if [ "$public_scheme" = "https" ] && [ "$public_port" != "443" ]; then
    public_port_suffix=":$public_port"
  fi

  printf '%s://%s%s' "$public_scheme" "$domain" "$public_port_suffix"
}

apply_env_updates() {
  local container="$1"
  local updates_file="$2"
  local current_env_file merged_env_file
  current_env_file="$(mktemp)"
  merged_env_file="$(mktemp)"

  if ! docker cp "${container}:/opt/codexsun/runtime/.env" "$current_env_file" >/dev/null 2>&1; then
    rm -f "$current_env_file" "$merged_env_file"
    die "Failed to read runtime env from $container."
  fi

  if ! awk -F= '
    NR==FNR {
      key=$1
      value=substr($0, index($0, "=") + 1)
      updates[key]=value
      order[++count]=key
      next
    }
    {
      key=$0
      sub(/=.*/, "", key)
      if (key in updates) {
        print key "=" updates[key]
        seen[key]=1
      } else {
        print
      }
    }
    END {
      for (i = 1; i <= count; i++) {
        key=order[i]
        if (!(key in seen)) {
          print key "=" updates[key]
        }
      }
    }
  ' "$updates_file" "$current_env_file" > "$merged_env_file"; then
    rm -f "$current_env_file" "$merged_env_file"
    die "Failed to merge runtime env updates for $container."
  fi

  if ! docker cp "$merged_env_file" "${container}:/opt/codexsun/runtime/.env" >/dev/null 2>&1; then
    rm -f "$current_env_file" "$merged_env_file"
    die "Failed to write runtime env back to $container."
  fi

  rm -f "$current_env_file" "$merged_env_file"
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
  local jwt_secret="${JWT_SECRET:-}"
  local super_admin_emails="${SUPER_ADMIN_EMAILS:-}"
  local public_base_url
  local public_port_suffix=""
  local updates_file

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

  updates_file="$(mktemp)"
  trap 'rm -f "$updates_file"' RETURN

  {
    printf 'APP_ENV=%s\n' "$RUNTIME_APP_ENV"
    printf 'APP_HOST=%s\n' "0.0.0.0"
    printf 'APP_DOMAIN=%s\n' "$domain"
    printf 'APP_HTTP_PORT=%s\n' "4000"
    printf 'TLS_ENABLED=%s\n' "$RUNTIME_TLS_ENABLED"
    printf 'FRONTEND_HOST=%s\n' "0.0.0.0"
    printf 'FRONTEND_DOMAIN=%s\n' "$domain"
    printf 'FRONTEND_HTTP_PORT=%s\n' "$public_port"
    printf 'VITE_FRONTEND_TARGET=%s\n' "$RUNTIME_FRONTEND_TARGET"
    printf 'CLOUDFLARE_ENABLED=%s\n' "$RUNTIME_CLOUDFLARE_ENABLED"
    printf 'DB_DRIVER=%s\n' "$RUNTIME_DB_DRIVER"
    printf 'SECRET_OWNER_EMAIL=%s\n' "$secret_owner_email"
    printf 'OPERATIONS_OWNER_EMAIL=%s\n' "$operations_owner_email"
    printf 'SECRETS_LAST_ROTATED_AT=%s\n' "$RUNTIME_SECRETS_LAST_ROTATED_AT"
    printf 'CODEXSUN_API_URL=%s\n' "$public_base_url"
    printf 'CODEXSUN_WEB_URL=%s\n' "$public_base_url"
    printf 'PORT=%s\n' "4000"
    printf 'SQLITE_FILE=%s\n' "$RUNTIME_SQLITE_FILE"
  } > "$updates_file"

  if [ -n "$jwt_secret" ]; then
    printf 'JWT_SECRET=%s\n' "$jwt_secret" >> "$updates_file"
  fi

  if [ -n "$super_admin_emails" ]; then
    printf 'SUPER_ADMIN_EMAILS=%s\n' "$super_admin_emails" >> "$updates_file"
  fi

  if [ "$RUNTIME_DB_DRIVER" = "sqlite" ]; then
    {
      printf 'DB_HOST=\n'
      printf 'DB_PORT=\n'
      printf 'DB_USER=\n'
      printf 'DB_PASSWORD=\n'
      printf 'DB_NAME=\n'
      printf 'DB_SSL=%s\n' "false"
    } >> "$updates_file"
  else
    {
      printf 'DB_HOST=%s\n' "$db_host"
      printf 'DB_PORT=%s\n' "$db_port"
      printf 'DB_USER=%s\n' "$db_user"
      printf 'DB_PASSWORD=%s\n' "$db_password"
      printf 'DB_NAME=%s\n' "$db_name"
      printf 'DB_SSL=%s\n' "false"
    } >> "$updates_file"
  fi
  {
    printf 'DB_BACKUP_ENABLED=%s\n' "$RUNTIME_DB_BACKUP_ENABLED"
    printf 'AUTH_OTP_DEBUG=%s\n' "false"
    printf 'GIT_SYNC_ENABLED=%s\n' "$GIT_SYNC_ENABLED"
    printf 'GIT_AUTO_UPDATE_ON_START=%s\n' "$GIT_AUTO_UPDATE_ON_START"
    printf 'GIT_FORCE_UPDATE_ON_START=%s\n' "$GIT_FORCE_UPDATE_ON_START"
    printf 'GIT_SCHEDULED_UPDATE_ENABLED=%s\n' "$GIT_SCHEDULED_UPDATE_ENABLED"
    printf 'GIT_SCHEDULED_UPDATE_CADENCE_MINUTES=%s\n' "$GIT_SCHEDULED_UPDATE_CADENCE_MINUTES"
    printf 'GIT_SCHEDULED_UPDATE_AUTO_APPLY=%s\n' "$GIT_SCHEDULED_UPDATE_AUTO_APPLY"
    printf 'GIT_REPOSITORY_URL=%s\n' "$GIT_REPOSITORY_URL"
    printf 'GIT_BRANCH=%s\n' "$GIT_BRANCH"
    printf 'INSTALL_DEPS_ON_START=%s\n' "$INSTALL_DEPS_ON_START"
    printf 'BUILD_ON_START=%s\n' "$BUILD_ON_START"
  } >> "$updates_file"

  apply_env_updates "$container" "$updates_file"
  rm -f "$updates_file"
  trap - RETURN
}

deploy_client() {
  local client_id="$1"
  load_client_config "$client_id"
  set_compose_runtime_vars

  ensure_compose_file "$CURRENT_CLIENT_NAME" "$CURRENT_COMPOSE_FILE" || return 0

  log "Deploying ${CURRENT_CLIENT_NAME}..."
  if [ "$BUILD_IMAGE" = "true" ]; then
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" up -d --no-build
  else
    "${COMPOSE_CMD[@]}" -f "$REPO_ROOT/$CURRENT_COMPOSE_FILE" up -d
  fi

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
  wait_for_app_ready "$CURRENT_CONTAINER" "$RUNTIME_PUBLIC_SCHEME"
  log "Live URL: $(format_public_url "$CURRENT_DOMAIN" "$CURRENT_PUBLIC_PORT" "$RUNTIME_PUBLIC_SCHEME")"
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

validate_selected_clients

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
