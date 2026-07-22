#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ACTION=${1:-verify}
[ "$ACTION" = "verify" ] || {
  echo "Usage: .container/release-local.sh verify" >&2
  exit 64
}

cd "$PROJECT_ROOT"
npm run check
npm run test:product-stacks
bash "$SCRIPT_DIR/deploy.sh" billing up
bash "$SCRIPT_DIR/smoke-test.sh"

echo "Local release gate completed: $ACTION"
