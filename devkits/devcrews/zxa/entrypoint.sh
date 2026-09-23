#!/bin/sh
set -eu

chown -R zxa:zxa "$CODEX_HOME"
exec runuser -u zxa -- "$@"
