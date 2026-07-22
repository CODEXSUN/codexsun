#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION=${1:-install}

case "$ACTION" in
  install|update)
    exec bash "$ROOT_DIR/.container/vps.sh" "$ACTION"
    ;;
  *)
    echo "Usage: bash install.sh [install|update]" >&2
    exit 64
    ;;
esac
