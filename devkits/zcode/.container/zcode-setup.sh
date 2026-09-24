#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/zcode-env.sh"
zcode_select_env "${1:-}"
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

if [ ! -f "$zcode_env_file" ]; then
  cp "$script_dir/.env.example" "$zcode_env_file"
fi

docker compose --env-file "$zcode_env_file" -f "$script_dir/docker-compose.yml" up -d --build --force-recreate --wait
docker compose --env-file "$zcode_env_file" -f "$script_dir/docker-compose.yml" ps
printf 'Open Zcode at http://127.0.0.1:%s/\n' "$(sed -n 's/^ZCODE_EDITOR_PORT=//p' "$zcode_env_file" | tail -n 1)"
preview_port="$(sed -n 's/^ZCODE_ZBROWSER_PORT=//p' "$zcode_env_file" | tail -n 1)"
printf 'Open Zbrowser at http://127.0.0.1:%s/\n' "${preview_port:-6133}"
