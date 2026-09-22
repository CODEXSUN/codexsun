#!/usr/bin/env sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
version="$(tr -d '\r\n' < "$repository_root/apps/devkits/cxforge/VERSION")"
image="${CXFORGE_IMAGE:-ghcr.io/codexsun/cxforge}"

docker build \
  --build-arg "CXFORGE_VERSION=$version" \
  --file "$repository_root/apps/devkits/cxforge/Dockerfile" \
  --tag "$image:$version" \
  --tag "$image:latest" \
  "$repository_root"

if [ "${CXFORGE_PUSH:-false}" = "true" ]; then
  docker push "$image:$version"
  docker push "$image:latest"
fi

printf 'CXForge image ready: %s:%s\n' "$image" "$version"
#!/usr/bin/env sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
version="$(tr -d '\r\n' < "$repository_root/apps/devkits/cxforge/VERSION")"
image="${CXFORGE_IMAGE:-ghcr.io/codexsun/cxforge}"

docker build \
  --build-arg "CXFORGE_VERSION=$version" \
  --file "$repository_root/apps/devkits/cxforge/Dockerfile" \
  --tag "$image:$version" \
  --tag "$image:latest" \
  "$repository_root"

if [ "${CXFORGE_PUSH:-false}" = "true" ]; then
  docker push "$image:$version"
  docker push "$image:latest"
fi

printf 'CXForge image ready: %s:%s\n' "$image" "$version"
