#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
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

if [ ! -f "$script_dir/.env" ]; then
  cp "$script_dir/.env.example" "$script_dir/.env"
fi

docker compose --env-file "$script_dir/.env" -f "$script_dir/docker-compose.yml" up -d --build --wait
docker compose --env-file "$script_dir/.env" -f "$script_dir/docker-compose.yml" ps
printf 'Open Zcode at http://127.0.0.1:%s/?folder=/home/workspace/codexsun\n' "$(sed -n 's/^ZCODE_EDITOR_PORT=//p' "$script_dir/.env" | tail -n 1)"
