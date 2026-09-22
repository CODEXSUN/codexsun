#!/usr/bin/env sh
set -eu

# Submit a project recipe. The Go worker performs every setup step.
[ "$#" -eq 1 ] && [ -r "$1" ] || {
  printf 'Usage: cxforge-workspace.sh path/to/setup.json\n' >&2
  exit 1
}
origin="${CXFORGE_API_ORIGIN:-http://127.0.0.1:6400}"
key="${CXFORGE_ZUNO_CLIENT_KEY:?Set CXFORGE_ZUNO_CLIENT_KEY}"
curl --fail --silent --show-error --max-time 30 \
  --header "X-CXForge-Client-Key: $key" \
  --header 'Content-Type: application/json' \
  --data-binary "@$1" "$origin/api/v1/cxforge/control/workspace/setup"
