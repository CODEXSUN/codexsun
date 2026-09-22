#!/usr/bin/env sh
set -eu

origin="${CXFORGE_ORIGIN:-http://127.0.0.1:6400}"
client_key="${CXFORGE_ZUNO_CLIENT_KEY:?Set CXFORGE_ZUNO_CLIENT_KEY}"

curl --fail --silent --show-error "$origin/api/v1/cxforge/health" >/dev/null
curl --fail --silent --show-error "$origin/api/v1/cxforge/runner/health" >/dev/null
curl --fail --silent --show-error \
  --header "Authorization: Bearer $client_key" \
  "$origin/api/v1/cxforge/control/overview" >/dev/null
curl --fail --silent --show-error \
  --header "Authorization: Bearer $client_key" \
  "$origin/api/v1/cxforge/control/metrics" >/dev/null
curl --fail --silent --show-error \
  --header "Authorization: Bearer $client_key" \
  "$origin/api/v1/cxforge/control/git-connections" >/dev/null

printf 'CXForge production checks passed for %s\n' "$origin"
