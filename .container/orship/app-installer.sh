#!/usr/bin/env bash
set -euo pipefail
APP=''; PORT=''; REPO=''
while [ "$#" -gt 0 ]; do case "$1" in --app) APP="$2"; shift 2;; --port) PORT="$2"; shift 2;; --repo) REPO="$2"; shift 2;; *) exit 2;; esac; done
[[ "$APP" =~ ^[a-z][a-z0-9-]{1,62}$ ]] || { echo 'Invalid application name.' >&2; exit 2; }
[[ "$PORT" =~ ^[0-9]{4,5}$ ]] && (( PORT >= 6000 && PORT <= 65535 )) || { echo 'Invalid port.' >&2; exit 2; }
[ "$REPO" = codexsun ] || { echo 'Only registered repositories are allowed.' >&2; exit 2; }
docker ps --format '{{.Ports}}' | grep -Eq "(^|:)${PORT}->" && { echo "Port ${PORT} is already assigned." >&2; exit 3; }
echo "Preflight passed: ${APP} can reserve ${PORT}."
echo 'Next implementation: create the reviewed worktree, secret store, Compose project, and health check.'
