#!/usr/bin/env sh
set -eu

workspace=/home/workspace/codexsun
lock_state="$workspace/node_modules/.zcode-lock.sha256"

if [ ! -d "$workspace/.git" ] || [ -e "$workspace/.git/index.lock" ] || [ ! -f "$workspace/package-lock.json" ]; then
  printf 'Zcode checkout is missing or incomplete: %s\n' "$workspace" >&2
  exit 1
fi

lock_hash="$(sha256sum "$workspace/package-lock.json" | cut -d ' ' -f 1)"
saved_hash=''
if [ -f "$lock_state" ]; then
  saved_hash="$(cat "$lock_state")"
fi

if [ "$lock_hash" != "$saved_hash" ] || [ ! -d "$workspace/node_modules" ]; then
  printf 'Installing repository npm dependencies...\n'
  cd "$workspace"
  npm ci --no-audit --no-fund
  printf '%s\n' "$lock_hash" > "$lock_state"
fi

printf 'Zcode workspace ready: %s\n' "$workspace"
exec /home/.openvscode-server/bin/openvscode-server \
  --host 0.0.0.0 \
  --without-connection-token \
  --disable-workspace-trust \
  --extensions-dir /opt/zcode/extensions \
  "$workspace"
