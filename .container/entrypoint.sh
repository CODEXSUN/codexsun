#!/bin/sh
set -eu

APP_ROOT="/opt/codexsun/app"
RUNTIME_ROOT="/opt/codexsun/runtime"
RUNTIME_ENV_FILE="$RUNTIME_ROOT/.env"
RUNTIME_STORAGE_ROOT="$RUNTIME_ROOT/storage"
SOURCE_ROOT="$APP_ROOT"

log() {
  printf '%s\n' "$1"
}

ensure_runtime_env_file() {
  mkdir -p "$RUNTIME_ROOT"

  if [ -d "$RUNTIME_ENV_FILE" ]; then
    rm -rf "$RUNTIME_ENV_FILE"
  fi

  if [ ! -f "$RUNTIME_ENV_FILE" ]; then
    cp "$APP_ROOT/.env.example" "$RUNTIME_ENV_FILE"
    return
  fi

  node - "$APP_ROOT/.env.example" "$RUNTIME_ENV_FILE" <<'NODE'
const fs = require('fs')
const dotenv = require('dotenv')

const templatePath = process.argv[2]
const runtimePath = process.argv[3]
const templateRaw = fs.readFileSync(templatePath, 'utf8')
const runtimeRaw = fs.readFileSync(runtimePath, 'utf8')
const template = dotenv.parse(templateRaw)
const runtime = dotenv.parse(runtimeRaw)
const runtimeLines = runtimeRaw.split(/\r?\n/)
let changed = false

for (const [key, value] of Object.entries(template)) {
  if (Object.prototype.hasOwnProperty.call(runtime, key)) {
    continue
  }

  if (runtimeLines.length > 0 && runtimeLines[runtimeLines.length - 1] !== '') {
    runtimeLines.push('')
  }

  runtimeLines.push(`${key}=${value}`)
  changed = true
}

if (changed) {
  fs.writeFileSync(runtimePath, `${runtimeLines.join('\n').replace(/\n*$/, '\n')}`, 'utf8')
}
NODE
}

prepare_source_layout() {
  target_root="$1"

  mkdir -p \
    "$RUNTIME_STORAGE_ROOT/public" \
    "$RUNTIME_STORAGE_ROOT/private" \
    "$RUNTIME_STORAGE_ROOT/backups/database"

  rm -rf "$target_root/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT" "$target_root/storage"

  mkdir -p "$target_root/public"
  rm -rf "$target_root/public/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT/public" "$target_root/public/storage"

  rm -f "$target_root/.env"
  ln -sfn "$RUNTIME_ENV_FILE" "$target_root/.env"
}

load_runtime_env() {
  eval "$(node - "$RUNTIME_ENV_FILE" <<'NODE'
const fs = require('fs')
const dotenv = require('dotenv')

const envFilePath = process.argv[2]
const env = dotenv.parse(fs.readFileSync(envFilePath, 'utf8'))
const keys = [
  'GIT_SYNC_ENABLED',
  'GIT_AUTO_UPDATE_ON_START',
  'GIT_FORCE_UPDATE_ON_START',
  'GIT_REPOSITORY_URL',
  'GIT_BRANCH',
  'INSTALL_DEPS_ON_START',
  'BUILD_ON_START',
]

for (const key of keys) {
  const value = env[key] ?? ''
  console.log(`export ${key}=${JSON.stringify(value)}`)
}
NODE
)"
}

update_runtime_env_value() {
  node - "$RUNTIME_ENV_FILE" "$1" "$2" <<'NODE'
const fs = require('fs')

const envFilePath = process.argv[2]
const key = process.argv[3]
const value = process.argv[4]
const existingRaw = fs.readFileSync(envFilePath, 'utf8')
const lines = existingRaw.split(/\r?\n/)
let updated = false

const nextLines = lines.map((line) => {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)

  if (!match || match[1] !== key) {
    return line
  }

  updated = true
  return `${key}=${value}`
})

if (!updated) {
  if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') {
    nextLines.push('')
  }

  nextLines.push(`${key}=${value}`)
}

fs.writeFileSync(envFilePath, `${nextLines.join('\n').replace(/\n*$/, '\n')}`, 'utf8')
NODE
}

run_npm_install() {
  if [ -f package-lock.json ]; then
    npm ci
    return
  fi

  npm install
}

build_source() {
  npm run build:api
  npm run build:web
}

current_layout_exists() {
  target_root="$1"

  [ -f "$target_root/apps/core/api/src/server.ts" ] && [ -f "$target_root/apps/ecommerce/web/vite.config.ts" ]
}

current_build_exists() {
  target_root="$1"

  [ -f "$target_root/apps/core/api/dist/server.js" ] && [ -f "$target_root/apps/ecommerce/web/dist/index.html" ]
}

sync_from_git() {
  if [ -z "${GIT_REPOSITORY_URL:-}" ]; then
    log "GIT_REPOSITORY_URL is required when GIT_SYNC_ENABLED=true."
    exit 1
  fi

  SOURCE_ROOT="$RUNTIME_ROOT/source"
  NEXT_SOURCE_ROOT="$RUNTIME_ROOT/source.next"
  should_refresh_source="false"
  should_use_existing_source="false"

  if [ "${GIT_FORCE_UPDATE_ON_START:-false}" = "true" ] || [ "${GIT_AUTO_UPDATE_ON_START:-false}" = "true" ]; then
    should_refresh_source="true"
  fi

  if [ -d "$SOURCE_ROOT/.git" ] && [ "$should_refresh_source" != "true" ]; then
    if current_layout_exists "$SOURCE_ROOT"; then
      should_use_existing_source="true"
    else
      log "Existing runtime Git checkout uses an old app layout. Refreshing it."
      should_refresh_source="true"
    fi
  fi

  if [ "$should_use_existing_source" = "true" ]; then
    log "Using existing runtime Git source checkout without pulling updates."
  else
    if [ -d "$SOURCE_ROOT" ]; then
      log "Refreshing source from Git with a clean runtime clone..."
    else
      log "Cloning source from Git..."
    fi

    rm -rf "$NEXT_SOURCE_ROOT"
    git clone --branch "${GIT_BRANCH:-main}" --depth 1 "$GIT_REPOSITORY_URL" "$NEXT_SOURCE_ROOT"
    prepare_source_layout "$NEXT_SOURCE_ROOT"
    cd "$NEXT_SOURCE_ROOT"
    run_npm_install
    build_source
    rm -rf "$SOURCE_ROOT"
    mv "$NEXT_SOURCE_ROOT" "$SOURCE_ROOT"
    should_refresh_source="true"
  fi

  prepare_source_layout "$SOURCE_ROOT"
  cd "$SOURCE_ROOT"

  if [ "$should_refresh_source" != "true" ] && [ ! -d node_modules ]; then
    run_npm_install
  fi

  if [ "$should_refresh_source" != "true" ] && ! current_build_exists "$SOURCE_ROOT"; then
    build_source
  fi

  if ! current_build_exists "$SOURCE_ROOT"; then
    log "Runtime Git source did not produce the current build layout. Falling back to bundled app source."
    SOURCE_ROOT="$APP_ROOT"
    prepare_source_layout "$SOURCE_ROOT"
    cd "$SOURCE_ROOT"
  fi

  if [ "${GIT_FORCE_UPDATE_ON_START:-false}" = "true" ]; then
    update_runtime_env_value "GIT_FORCE_UPDATE_ON_START" "false"
  fi
}

ensure_runtime_env_file
prepare_source_layout "$APP_ROOT"
load_runtime_env

if [ "${GIT_SYNC_ENABLED:-false}" = "true" ]; then
  sync_from_git
else
  cd "$APP_ROOT"

  if [ "${INSTALL_DEPS_ON_START:-false}" = "true" ]; then
    log "Installing dependencies on container start..."
    run_npm_install
  fi

  if [ "${BUILD_ON_START:-false}" = "true" ]; then
    log "Building application on container start..."
    build_source
  fi
fi

cd "$SOURCE_ROOT"
log "Starting Codexsun API and static web server..."
exec node apps/core/api/dist/server.js
