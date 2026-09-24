#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/zcode-env.sh"
case "${1:-}" in
  --purge) action=--purge; zcode_select_env "${2:-}" ;;
  *) action=''; zcode_select_env "${1:-}" ;;
esac
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
cd "$repository_root"

git_root="$(git rev-parse --show-toplevel)"
if [ "$(CDPATH='' cd -- "$git_root" && pwd)" != "$repository_root" ]; then
  printf 'Run Zcode only from its repository checkout.\n' >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { printf 'Docker is required.\n' >&2; exit 1; }
docker info >/dev/null
docker compose version >/dev/null
[ -f "$zcode_env_file" ] || { printf 'Run zcode-setup.sh first.\n' >&2; exit 1; }

case "$action" in
  '')
    docker compose --env-file "$zcode_env_file" -f "$script_dir/docker-compose.yml" down
    printf 'Zcode containers stopped. Workspace files and editor settings remain.\n'
    ;;
  --purge)
    docker compose --env-file "$zcode_env_file" -f "$script_dir/docker-compose.yml" down --volumes --rmi local --remove-orphans
    printf 'Zcode containers, workspace, editor settings, and Zcode-built images removed.\n'
    ;;
  *)
    printf 'Usage: %s [--purge] [profile]\n' "$0" >&2
    exit 2
    ;;
esac
