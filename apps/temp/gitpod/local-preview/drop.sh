#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../../.." && pwd)"
cd "$repository_root"

git_root="$(git rev-parse --show-toplevel)"
if [ "$(CDPATH='' cd -- "$git_root" && pwd)" != "$repository_root" ]; then
  printf 'Run Gitpod review only from this repository.\n' >&2
  exit 1
fi

case "${1:-}" in
  '') docker compose -f "$script_dir/compose.yml" down ;;
  --purge) docker compose -f "$script_dir/compose.yml" down --volumes ;;
  *) printf 'Usage: %s [--purge]\n' "$0" >&2; exit 2 ;;
esac
