#!/usr/bin/env bash
set -euo pipefail
ACTION=""; REPOS=""
while [ "$#" -gt 0 ]; do case "$1" in --action) ACTION="$2"; shift 2;; --repo) REPOS="$2"; shift 2;; *) echo "Usage: $0 --action compare|pull --repo codexsun" >&2; exit 2;; esac; done
[ "$REPOS" = "CODEXSUN" ] || [ "$REPOS" = "codexsun" ] || { echo "Only the registered codexsun repository is allowed." >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
case "$ACTION" in compare) git status --short; git log -1 --oneline;; pull) git pull --ff-only;; *) echo "Unsupported action." >&2; exit 2;; esac
