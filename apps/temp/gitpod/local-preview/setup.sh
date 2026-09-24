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

command -v docker >/dev/null 2>&1 || { printf 'Docker is required.\n' >&2; exit 1; }
docker info >/dev/null
docker compose version >/dev/null
docker compose -f "$script_dir/compose.yml" up -d
docker compose -f "$script_dir/compose.yml" ps
printf 'Gitpod review startup may take several minutes. Run local-preview/verify.sh.\n'
