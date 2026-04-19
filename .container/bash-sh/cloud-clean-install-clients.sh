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

AVAILABLE_CLIENTS=()
SELECTED_CLIENTS=()

discover_clients() {
  AVAILABLE_CLIENTS=()

  if [ -f "$CLIENT_LIST_FILE" ]; then
    while IFS= read -r listed_client; do
      [ -n "$listed_client" ] || continue
      [ -d "$CLIENTS_DIR/$listed_client" ] || die "Client '$listed_client' is listed but missing under $CLIENTS_DIR"
      [ -f "$CLIENTS_DIR/$listed_client/setup.sh" ] || die "Client '$listed_client' is listed but missing setup.sh"
      AVAILABLE_CLIENTS+=("$listed_client")
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
  fi

  [ "${#AVAILABLE_CLIENTS[@]}" -gt 0 ] || die "No clients discovered from $CLIENT_LIST_FILE"
}

show_help() {
  cat <<EOF
Cloud clean-install helper

Usage:
  ./.container/bash-sh/cloud-clean-install-clients.sh all
  ./.container/bash-sh/cloud-clean-install-clients.sh codexsun
  ./.container/bash-sh/cloud-clean-install-clients.sh codexsun tirupurdirect_com techmedia_in

Required environment:
  JWT_SECRET

Optional environment:
  BUILD_FIRST_IMAGE=true|false                Default: true
  REBUILD_EACH_CLIENT=true|false              Default: false
  START_MARIADB=true|false                    Default: false
  SECRET_OWNER_EMAIL                          Global fallback
  OPERATIONS_OWNER_EMAIL                      Global fallback
  SUPER_ADMIN_EMAILS                          Global fallback
  <CLIENT_ENV_PREFIX>_DOMAIN                  Per-client domain override
  <CLIENT_ENV_PREFIX>_SECRET_OWNER_EMAIL      Per-client security mail override
  <CLIENT_ENV_PREFIX>_OPERATIONS_OWNER_EMAIL  Per-client operations mail override
  <CLIENT_ENV_PREFIX>_SUPER_ADMIN_EMAILS      Per-client admin mail override

Examples:
  JWT_SECRET='secret' ./.container/bash-sh/cloud-clean-install-clients.sh codexsun
  JWT_SECRET='secret' ./.container/bash-sh/cloud-clean-install-clients.sh all

Available clients:
$(printf '  - %s\n' "${AVAILABLE_CLIENTS[@]}")
EOF
}

parse_selected_clients() {
  SELECTED_CLIENTS=()

  if [ "$#" -eq 0 ]; then
    die "Pass one or more clients, or 'all'. Use --help for usage."
  fi

  if [ "$1" = "all" ]; then
    SELECTED_CLIENTS=("${AVAILABLE_CLIENTS[@]}")
    return
  fi

  local candidate found
  for candidate in "$@"; do
    found="false"
    local known
    for known in "${AVAILABLE_CLIENTS[@]}"; do
      if [ "$known" = "$candidate" ]; then
        found="true"
        break
      fi
    done
    [ "$found" = "true" ] || die "Unknown client: $candidate"
    SELECTED_CLIENTS+=("$candidate")
  done
}

load_client_config() {
  local client_id="$1"
  local config_file="$CLIENTS_DIR/$client_id/client.conf.sh"

  [ -f "$config_file" ] || die "Missing config file: $config_file"

  CLIENT_ID=""
  CLIENT_DISPLAY_NAME=""
  CLIENT_ENV_PREFIX="$(normalize_env_prefix "$client_id")"
  CLIENT_DOMAIN_CLOUD=""

  # shellcheck disable=SC1090
  . "$config_file"
}

resolve_value() {
  local primary_var="$1"
  local fallback="$2"
  local value="${!primary_var:-}"
  if [ -n "$value" ]; then
    printf '%s' "$value"
    return
  fi
  printf '%s' "$fallback"
}

run_client_install() {
  local client_id="$1"
  local build_image="$2"

  load_client_config "$client_id"

  local client_domain_var="${CLIENT_ENV_PREFIX}_DOMAIN"
  local client_secret_var="${CLIENT_ENV_PREFIX}_SECRET_OWNER_EMAIL"
  local client_ops_var="${CLIENT_ENV_PREFIX}_OPERATIONS_OWNER_EMAIL"
  local client_admin_var="${CLIENT_ENV_PREFIX}_SUPER_ADMIN_EMAILS"

  local domain
  local secret_owner
  local operations_owner
  local super_admins

  domain="$(resolve_value "$client_domain_var" "$CLIENT_DOMAIN_CLOUD")"
  secret_owner="$(resolve_value "$client_secret_var" "${SECRET_OWNER_EMAIL:-security@$domain}")"
  operations_owner="$(resolve_value "$client_ops_var" "${OPERATIONS_OWNER_EMAIL:-ops@$domain}")"
  super_admins="$(resolve_value "$client_admin_var" "${SUPER_ADMIN_EMAILS:-admin@$domain}")"

  log ""
  log "=== ${client_id} ==="
  log "Domain: $domain"
  log "DB: ${CLIENT_DB_NAME_CLOUD:-}"
  log "Build image: $build_image"

  TARGET_ENV=cloud \
  JWT_SECRET="$JWT_SECRET" \
  SECRET_OWNER_EMAIL="$secret_owner" \
  OPERATIONS_OWNER_EMAIL="$operations_owner" \
  SUPER_ADMIN_EMAILS="$super_admins" \
  START_MARIADB="${START_MARIADB:-false}" \
  BUILD_IMAGE="$build_image" \
  CREATE_DATABASES=true \
  CLEAN_INSTALL=true \
  CONFIRM_CLEAN_INSTALL=YES \
  DROP_DATABASES=true \
  CONFIRM_DROP_DATABASES=YES \
  "$REPO_ROOT/.container/clients/$client_id/setup.sh"
}

discover_clients

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  show_help
  exit 0
fi

require_cmd bash
require_cmd docker
[ -n "${JWT_SECRET:-}" ] || die "JWT_SECRET is required."

parse_selected_clients "$@"

BUILD_FIRST_IMAGE="${BUILD_FIRST_IMAGE:-true}"
REBUILD_EACH_CLIENT="${REBUILD_EACH_CLIENT:-false}"

current_build_flag="$BUILD_FIRST_IMAGE"

for client_id in "${SELECTED_CLIENTS[@]}"; do
  run_client_install "$client_id" "$current_build_flag"
  if [ "$REBUILD_EACH_CLIENT" = "true" ]; then
    current_build_flag="true"
  else
    current_build_flag="false"
  fi
done

log ""
log "Cloud clean-install sequence complete."
