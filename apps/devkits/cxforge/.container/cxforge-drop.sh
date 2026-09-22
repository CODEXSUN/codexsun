#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
compose_file="$script_dir/compose.yml"
project_name="${CXFORGE_PROJECT_NAME:-cxforge}"

confirm_drop() {
  [ "${CXFORGE_CONFIRM_DROP:-}" = "yes" ] && return 0
  if [ ! -t 0 ]; then
    printf 'Set CXFORGE_CONFIRM_DROP=yes to delete CXForge data.\n' >&2
    return 1
  fi
  printf 'This deletes CXForge tasks, repositories, volumes, and local images. Type DROP CXFORGE: '
  read -r answer
  [ "$answer" = "DROP CXFORGE" ] || {
    printf 'Drop canceled.\n'
    return 1
  }
}

remove_cxforge_images() {
  image_repository="${CXFORGE_IMAGE:-cxforge}"
  image_ids="$(docker image ls "$image_repository" --format '{{.ID}}' | sort -u)"
  [ -z "$image_ids" ] && return 0
  for image_id in $image_ids; do
    docker image rm "$image_id" >/dev/null 2>&1 || printf 'Kept image in use: %s\n' "$image_id"
  done
}

command -v docker >/dev/null 2>&1 || {
  printf 'Required command is unavailable: docker\n' >&2
  exit 1
}
docker info >/dev/null
docker compose version >/dev/null
confirm_drop

docker compose -p "$project_name" -f "$compose_file" down --volumes --remove-orphans --rmi local
# Older releases declared volumes that are absent from the current Compose file.
project_volumes="$(docker volume ls --filter "label=com.docker.compose.project=$project_name" --format '{{.Name}}')"
for volume in $project_volumes; do
  docker volume rm "$volume"
done
remove_cxforge_images

if [ "${CXFORGE_PURGE_GLOBAL_BUILD_CACHE:-false}" = "true" ]; then
  printf 'Purging the shared Docker build cache. This affects other projects.\n'
  docker builder prune --force
fi

printf 'CXForge containers, project volumes, and unused local images were removed.\n'
printf 'Run cxforge-setup.sh with CXFORGE_NO_CACHE=true for a clean build.\n'
