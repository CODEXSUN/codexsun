#!/bin/sh
set -eu

IMAGE_APP_ROOT="/opt/codexsun/app"
RUNTIME_ROOT="/opt/codexsun/runtime"
RUNTIME_ENV_FILE="$RUNTIME_ROOT/.env"
RUNTIME_STORAGE_ROOT="$RUNTIME_ROOT/storage"
RUNTIME_REPO_ROOT="$RUNTIME_ROOT/repository"

log() {
  printf '%s\n' "$1"
}

is_truthy() {
  case "$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

read_runtime_env_value() {
  key="$1"
  fallback="${2:-}"

  if [ ! -f "$RUNTIME_ENV_FILE" ]; then
    printf '%s' "$fallback"
    return
  fi

  value="$(awk -F= -v key="$key" '
    /^[[:space:]]*#/ { next }
    NF >= 2 {
      current=$1
      sub(/^[[:space:]]+/, "", current)
      sub(/[[:space:]]+$/, "", current)
      if (current == key) {
        output=substr($0, index($0, "=") + 1)
        sub(/^[[:space:]]+/, "", output)
        sub(/[[:space:]]+$/, "", output)
        print output
        exit
      }
    }
  ' "$RUNTIME_ENV_FILE")"

  if [ -z "$value" ]; then
    printf '%s' "$fallback"
    return
  fi

  value="$(printf '%s' "$value" | sed "s/^['\"]//; s/['\"]$//")"
  printf '%s' "$value"
}

resolve_startup_value() {
  key="$1"
  fallback="${2:-}"
  eval "current_value=\${$key:-}"

  if [ -n "$current_value" ]; then
    printf '%s' "$current_value"
    return
  fi

  read_runtime_env_value "$key" "$fallback"
}

ensure_runtime_env_file() {
  mkdir -p "$RUNTIME_ROOT"

  if [ ! -f "$RUNTIME_ENV_FILE" ]; then
    cp "$IMAGE_APP_ROOT/.env.sample" "$RUNTIME_ENV_FILE"
  fi
}

ensure_runtime_git_excludes() {
  app_root="$1"
  exclude_file="$app_root/.git/info/exclude"

  if [ ! -f "$exclude_file" ]; then
    return
  fi

  for pattern in "/storage" "/public/storage"; do
    if ! grep -qxF "$pattern" "$exclude_file"; then
      printf '%s\n' "$pattern" >> "$exclude_file"
    fi
  done
}

clear_build_artifacts() {
  app_root="$1"
  rm -rf \
    "$app_root/build" \
    "$app_root/dist" \
    "$app_root/dist-ssr" \
    "$app_root/node_modules/.vite"
}

checkout_runtime_branch() {
  repo_root="$1"
  branch="$2"

  if git -C "$repo_root" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$repo_root" checkout "$branch" >/dev/null 2>&1
    return
  fi

  git -C "$repo_root" checkout -B "$branch" "origin/$branch" >/dev/null 2>&1
}

sync_runtime_repository() {
  repo_url="$(resolve_startup_value "GIT_REPOSITORY_URL" "https://github.com/CODEXSUN/codexsun.git")"
  branch="$(resolve_startup_value "GIT_BRANCH" "main")"
  auto_update="$(resolve_startup_value "GIT_AUTO_UPDATE_ON_START" "false")"
  force_update="$(resolve_startup_value "GIT_FORCE_UPDATE_ON_START" "false")"
  install_deps="$(resolve_startup_value "INSTALL_DEPS_ON_START" "false")"
  build_on_start="$(resolve_startup_value "BUILD_ON_START" "false")"
  repo_bootstrapped="false"
  repo_updated="false"
  force_requested="false"
  current_commit=""

  if ! command -v git >/dev/null 2>&1; then
    log "Git sync is enabled, but git is not installed in the container."
    exit 1
  fi

  if [ ! -d "$RUNTIME_REPO_ROOT/.git" ]; then
    log "Cloning runtime repository from $repo_url ($branch)..."
    rm -rf "$RUNTIME_REPO_ROOT"
    git clone --branch "$branch" --single-branch "$repo_url" "$RUNTIME_REPO_ROOT"
    repo_bootstrapped="true"
    repo_updated="true"
  else
    current_commit="$(git -C "$RUNTIME_REPO_ROOT" rev-parse HEAD 2>/dev/null || printf '')"

    if git -C "$RUNTIME_REPO_ROOT" remote get-url origin >/dev/null 2>&1; then
      git -C "$RUNTIME_REPO_ROOT" remote set-url origin "$repo_url"
    else
      git -C "$RUNTIME_REPO_ROOT" remote add origin "$repo_url"
    fi

    git -C "$RUNTIME_REPO_ROOT" fetch --prune origin
    checkout_runtime_branch "$RUNTIME_REPO_ROOT" "$branch"

    if is_truthy "$force_update"; then
      force_requested="true"
      log "Forcing runtime repository to origin/$branch..."
      git -C "$RUNTIME_REPO_ROOT" reset --hard "origin/$branch"
      git -C "$RUNTIME_REPO_ROOT" clean -fd
    elif is_truthy "$auto_update"; then
      if [ -n "$(git -C "$RUNTIME_REPO_ROOT" status --porcelain)" ]; then
        log "Skipping auto update because the runtime repository has local changes."
      else
        log "Updating runtime repository from origin/$branch..."
        git -C "$RUNTIME_REPO_ROOT" reset --hard "origin/$branch"
      fi
    fi

    if [ "$current_commit" != "$(git -C "$RUNTIME_REPO_ROOT" rev-parse HEAD 2>/dev/null || printf '')" ]; then
      repo_updated="true"
    fi
  fi

  ensure_runtime_git_excludes "$RUNTIME_REPO_ROOT"

  if [ ! -d "$RUNTIME_REPO_ROOT/node_modules" ] || [ "$repo_bootstrapped" = "true" ] || [ "$repo_updated" = "true" ] || [ "$force_requested" = "true" ] || is_truthy "$install_deps"; then
    log "Installing runtime dependencies..."
    (cd "$RUNTIME_REPO_ROOT" && npm ci)
  fi

  if [ ! -f "$RUNTIME_REPO_ROOT/build/app/cxapp/server/cxapp/src/server/index.js" ] || [ "$repo_bootstrapped" = "true" ] || [ "$repo_updated" = "true" ] || [ "$force_requested" = "true" ] || is_truthy "$build_on_start"; then
    log "Clearing build cache and rebuilding runtime repository..."
    clear_build_artifacts "$RUNTIME_REPO_ROOT"
    (cd "$RUNTIME_REPO_ROOT" && npm run build)
  fi
}

prepare_runtime_layout() {
  app_root="$1"

  mkdir -p \
    "$RUNTIME_STORAGE_ROOT/public" \
    "$RUNTIME_STORAGE_ROOT/private" \
    "$RUNTIME_STORAGE_ROOT/backups/database"

  rm -rf "$app_root/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT" "$app_root/storage"

  mkdir -p "$app_root/public"
  rm -rf "$app_root/public/storage"
  ln -sfn "$RUNTIME_STORAGE_ROOT/public" "$app_root/public/storage"

  rm -f "$app_root/.env"
  ln -sfn "$RUNTIME_ENV_FILE" "$app_root/.env"
}

ensure_runtime_env_file

ACTIVE_APP_ROOT="$IMAGE_APP_ROOT"
if is_truthy "$(resolve_startup_value "GIT_SYNC_ENABLED" "false")"; then
  sync_runtime_repository
  ACTIVE_APP_ROOT="$RUNTIME_REPO_ROOT"
fi

prepare_runtime_layout "$ACTIVE_APP_ROOT"

cd "$ACTIVE_APP_ROOT"
log "Starting Codexsun API and static web server..."
exec npm start
