#!/bin/sh
set -eu

APP_ROOT="/opt/codexsun/app"
RUNTIME_ROOT="/opt/codexsun/runtime"
RUNTIME_ENV_FILE="$RUNTIME_ROOT/.env"
RUNTIME_STORAGE_ROOT="$RUNTIME_ROOT/storage"

log() {
  printf '%s\n' "$1"
}

ensure_runtime_env_file() {
  mkdir -p "$RUNTIME_ROOT"

  if [ ! -f "$RUNTIME_ENV_FILE" ]; then
    cp "$APP_ROOT/.env.sample" "$RUNTIME_ENV_FILE"
  fi
}

prepare_runtime_layout() {
  mkdir -p \
    "$RUNTIME_STORAGE_ROOT/public" \
    "$RUNTIME_STORAGE_ROOT/private" \
    "$RUNTIME_STORAGE_ROOT/backups/database"

  rm -rf "$APP_ROOT/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT" "$APP_ROOT/storage"

  mkdir -p "$APP_ROOT/public"
  rm -rf "$APP_ROOT/public/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT/public" "$APP_ROOT/public/storage"

  rm -f "$APP_ROOT/.env"
  ln -sfn "$RUNTIME_ENV_FILE" "$APP_ROOT/.env"
}

ensure_runtime_env_file
prepare_runtime_layout

cd "$APP_ROOT"
log "Starting Codexsun API and static web server..."
exec npm start
