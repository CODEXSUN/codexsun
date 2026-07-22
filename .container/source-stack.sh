#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$PROJECT_ROOT/.." && pwd)"
ACTION=${1:-install}
REPOSITORIES="framework ui core billing mail"

case "$ACTION" in
  install|update) ;;
  *) echo "Usage: .container/source-stack.sh <install|update>" >&2; exit 64 ;;
esac

command -v git >/dev/null 2>&1 || {
  echo "Git is required." >&2
  exit 69
}

for repository in $REPOSITORIES; do
  directory="$WORKSPACE_ROOT/$repository"
  remote="https://github.com/CODEXSUN/${repository}.git"
  if [ ! -d "$directory/.git" ]; then
    if [ -e "$directory" ]; then
      echo "Cannot clone $repository: $directory exists but is not a Git repository." >&2
      exit 73
    fi
    git clone --branch main --single-branch "$remote" "$directory"
  fi
done

if [ "$ACTION" = "update" ]; then
  for directory in "$PROJECT_ROOT" \
    "$WORKSPACE_ROOT/framework" "$WORKSPACE_ROOT/ui" "$WORKSPACE_ROOT/core" \
    "$WORKSPACE_ROOT/billing" "$WORKSPACE_ROOT/mail"; do
    [ -z "$(git -C "$directory" status --porcelain)" ] || {
      echo "Update stopped: uncommitted changes in $directory" >&2
      exit 65
    }
  done

  for directory in "$WORKSPACE_ROOT/framework" "$WORKSPACE_ROOT/ui" \
    "$WORKSPACE_ROOT/core" "$WORKSPACE_ROOT/billing" "$WORKSPACE_ROOT/mail" \
    "$PROJECT_ROOT"; do
    git -C "$directory" pull --ff-only origin main
  done
fi

echo "CODEXSUN Billing sources are ready under $WORKSPACE_ROOT."
