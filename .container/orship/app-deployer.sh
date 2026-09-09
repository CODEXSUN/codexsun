#!/usr/bin/env bash
set -euo pipefail
[ "${1:-}" = "--repo" ] && [ "${2:-}" = "codexsun" ] && [ "${3:-}" = "--mode" ] && [ "${4:-}" = "manual" ] || { echo 'Usage: app-deployer.sh --repo codexsun --mode manual' >&2; exit 2; }
echo 'Verify the selected release, then run its repository-specific installer manually.'
