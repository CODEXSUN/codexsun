#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_SETUP_SCRIPT="$(cd "$SCRIPT_DIR/../.." && pwd)/setup.sh"
CONFIG_FILE="$SCRIPT_DIR/client.conf.sh"

[ -f "$ROOT_SETUP_SCRIPT" ] || { printf '%s\n' "Missing root setup script: $ROOT_SETUP_SCRIPT"; exit 1; }
[ -f "$CONFIG_FILE" ] || { printf '%s\n' "Missing client config: $CONFIG_FILE"; exit 1; }

# shellcheck disable=SC1090
. "$CONFIG_FILE"

TARGET_ENV="${TARGET_ENV:-local}"
case "$TARGET_ENV" in
  local|cloud) ;;
  *)
    printf '%s\n' "TARGET_ENV must be 'local' or 'cloud'."
    exit 1
    ;;
esac

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<EOF
${CLIENT_ID} client setup

Usage:
  ./.container/clients/${CLIENT_ID}/setup.sh
  TARGET_ENV=cloud ./.container/clients/${CLIENT_ID}/setup.sh

Default:
  TARGET_ENV=local
EOF
  exit 0
fi

export CLIENTS="$CLIENT_ID"
export TARGET_ENV
export START_MARIADB="false"

exec "$ROOT_SETUP_SCRIPT"
