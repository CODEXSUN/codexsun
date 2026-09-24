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

docker compose -f "$script_dir/compose.yml" ps
pods="$(docker compose -f "$script_dir/compose.yml" exec -T gitpod kubectl get pods -A --no-headers)"
printf '%s\n' "$pods"

if printf '%s\n' "$pods" | awk '$4 == "Completed" { next } $4 != "Running" { bad = 1; next } { split($3, parts, "/"); if (parts[1] != parts[2]) bad = 1 } END { exit (NR > 0 && !bad) ? 0 : 1 }'; then
  printf 'Gitpod services are ready.\n'
else
  printf 'Gitpod services are not ready. Check pod events and image availability.\n' >&2
  exit 1
fi
