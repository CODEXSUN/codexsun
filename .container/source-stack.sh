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
  update_directories=(
    "$WORKSPACE_ROOT/framework"
    "$WORKSPACE_ROOT/ui"
    "$WORKSPACE_ROOT/core"
    "$WORKSPACE_ROOT/billing"
    "$WORKSPACE_ROOT/mail"
    "$PROJECT_ROOT"
  )

  echo "Checking all six repositories before changing any checkout."
  for directory in "${update_directories[@]}"; do
    repository=$(basename "$directory")
    branch=$(git -C "$directory" branch --show-current)
    [ "$branch" = "main" ] || {
      echo "Update stopped: $repository is on ${branch:-a detached HEAD}, not main." >&2
      exit 65
    }
    [ -z "$(git -C "$directory" status --porcelain)" ] || {
      echo "Update stopped: uncommitted changes in $repository ($directory)." >&2
      exit 65
    }
    git -C "$directory" remote get-url origin >/dev/null 2>&1 || {
      echo "Update stopped: $repository has no origin remote." >&2
      exit 65
    }
  done

  echo "Fetching origin/main for every repository before any fast-forward."
  for directory in "${update_directories[@]}"; do
    repository=$(basename "$directory")
    echo "Fetching $repository..."
    git -C "$directory" fetch --prune origin main
  done

  echo "Comparing every local main branch with its fetched origin/main."
  for directory in "${update_directories[@]}"; do
    repository=$(basename "$directory")
    current=$(git -C "$directory" rev-parse --short HEAD)
    remote=$(git -C "$directory" rev-parse --short refs/remotes/origin/main)
    read -r ahead behind < <(
      git -C "$directory" rev-list --left-right --count HEAD...refs/remotes/origin/main
    )
    printf '%-10s local=%s remote=%s ahead=%s behind=%s\n' \
      "$repository" "$current" "$remote" "$ahead" "$behind"
    [ "$ahead" -eq 0 ] || {
      echo "Update stopped: $repository is ahead of or diverged from origin/main." >&2
      echo "Review and publish the repository through its approved Git workflow first." >&2
      exit 65
    }
  done

  echo "All repositories passed preflight. Fast-forwarding to the fetched revisions."
  for directory in "${update_directories[@]}"; do
    repository=$(basename "$directory")
    before=$(git -C "$directory" rev-parse --short HEAD)
    git -C "$directory" merge --ff-only refs/remotes/origin/main
    after=$(git -C "$directory" rev-parse --short HEAD)
    echo "$repository: $before -> $after"
  done
fi

echo "CODEXSUN Billing sources are ready under $WORKSPACE_ROOT."
