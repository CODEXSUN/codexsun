#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION=${1:-install}
export CODEXSUN_DEPLOY_ENV=${CODEXSUN_DEPLOY_ENV:-$SCRIPT_DIR/vps.env}

case "$ACTION" in
  install|update|edge-up|edge-down) ;;
  *) echo "Usage: .container/vps.sh <install|update|edge-up|edge-down>" >&2; exit 64 ;;
esac

if [ "$ACTION" = "install" ] || [ "$ACTION" = "update" ]; then
  if [ "$ACTION" = "update" ]; then
    echo "Update phase 1/4: inspect, fetch, compare, and fast-forward all eight repositories."
  fi
  bash "$SCRIPT_DIR/source-stack.sh" "$ACTION"
fi

if [ ! -f "$CODEXSUN_DEPLOY_ENV" ]; then
  cp "$SCRIPT_DIR/deploy.env.example" "$CODEXSUN_DEPLOY_ENV"
  chmod 600 "$CODEXSUN_DEPLOY_ENV" 2>/dev/null || true
  echo "Created $CODEXSUN_DEPLOY_ENV." >&2
  echo "Set the real domains, HTTPS origin, admin values, and backup marker, then rerun:" >&2
  echo "  bash .container/vps.sh $ACTION" >&2
  exit 78
fi

# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"
prepare_deploy_env
validate_deploy_env

[ "$(env_value CODEXSUN_IMAGE_REGISTRY codexsun)" = "codexsun" ] || {
  echo "Source-built VPS installation requires CODEXSUN_IMAGE_REGISTRY=codexsun." >&2
  exit 78
}
case "$(env_value PLATFORM_WEB_ORIGIN)" in
  https://*) ;;
  *) echo "PLATFORM_WEB_ORIGIN must be an HTTPS URL on the VPS." >&2; exit 78 ;;
esac
for key in \
  CODEXSUN_WEB_HOST CODEXSUN_MEDIA_HOST \
  CODEXSUN_TENANT_HOST_SUKRAA CODEXSUN_TENANT_HOST_COTTON \
  CODEXSUN_TENANT_HOST_GANAPATHI TRAEFIK_ACME_EMAIL; do
  value=$(env_value "$key")
  case "$value" in
    ""|*example.com*) echo "$key must contain the real VPS value." >&2; exit 78 ;;
  esac
done
[ -n "$(env_value CODEXSUN_VERIFIED_BACKUP_ID)" ] || {
  echo "CODEXSUN_VERIFIED_BACKUP_ID is required before a VPS migration." >&2
  exit 78
}

edge() {
  docker compose --env-file "$CODEXSUN_DEPLOY_ENV" \
    -f "$SCRIPT_DIR/traefik/docker-compose.yml" "$@"
}

case "$ACTION" in
  install)
    bash "$SCRIPT_DIR/setup.sh" billing
    edge up -d --wait --wait-timeout 120
    ;;
  update)
    echo "Update phases 2-3/4: build Billing images, then migrate and replace only Billing containers."
    bash "$SCRIPT_DIR/deploy.sh" billing up
    echo "Update phase 4/4: run the complete deployment smoke test."
    bash "$SCRIPT_DIR/smoke-test.sh"
    ;;
  edge-up) edge up -d --wait --wait-timeout 120 ;;
  edge-down) edge down ;;
esac

echo "VPS action completed: $ACTION"
