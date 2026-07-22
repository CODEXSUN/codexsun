#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

MODE=install
TARGET=billing

usage() {
  cat <<'EOF'
Usage: .container/setup.sh [--reinstall] [billing]

Installs/starts MariaDB, Redis, and Media once, then deploys Billing.

--reinstall replaces only Billing application containers and images, then runs
safe forward migrations. Shared MariaDB, Redis, Media, their named volumes, the
shared network, credentials, databases, and uploads remain untouched.

Shared infrastructure is bootstrapped only on a first installation where all
three shared containers are absent. Partial or unhealthy infrastructure causes
setup to stop for operator review.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --reinstall) MODE=reinstall ;;
    billing) TARGET=$arg ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 64 ;;
  esac
done

run_preflight

shared_infrastructure_count() {
  count=0
  for container in codexsun-mariadb codexsun-redis codexsun-media; do
    if docker container inspect "$container" >/dev/null 2>&1; then
      count=$((count + 1))
    fi
  done
  printf '%s' "$count"
}

require_shared_infrastructure() {
  for container in codexsun-mariadb codexsun-redis codexsun-media; do
    state=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || true)
    health=$(docker inspect "$container" \
      --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      2>/dev/null || true)
    [ "$state" = "running" ] && [ "$health" = "healthy" ] || {
      echo "Shared infrastructure is not healthy: $container (state=${state:-missing}, health=${health:-missing})." >&2
      echo "Application setup will not delete or recreate shared infrastructure." >&2
      exit 69
    }
  done
}

bootstrap_shared_infrastructure() {
  echo "First installation: bootstrapping the shared MariaDB, Redis, and Media layer."
  stack_compose database/mariadb build
  stack_compose database/mariadb up -d --no-build --wait --wait-timeout 180
  MSYS_NO_PATHCONV=1 docker exec codexsun-mariadb \
    bash /docker-entrypoint-initdb.d/10-codexsun-grants.sh >/dev/null
  echo "MariaDB application grants reconciled. Host access: $(env_value CODEXSUN_BIND_ADDRESS):$(env_value MARIADB_HOST_PORT)."

  stack_compose database/redis build
  stack_compose database/redis up -d --no-build --wait --wait-timeout 120

  stack_compose media build
  bash "$SCRIPT_DIR/setup-media.sh"
}

infrastructure_count=$(shared_infrastructure_count)
case "$infrastructure_count" in
  0)
    [ "$MODE" = "install" ] || {
      echo "Billing reinstall requires the existing shared infrastructure layer." >&2
      exit 69
    }
    ensure_network
    bootstrap_shared_infrastructure
    ;;
  3)
    require_network
    require_shared_infrastructure
    echo "Shared infrastructure is healthy and will not be rebuilt or replaced."
    ;;
  *)
    echo "Shared infrastructure is partial ($infrastructure_count/3 containers present)." >&2
    echo "Stop and repair it from the infrastructure owner; setup will not delete or recreate it." >&2
    exit 69
    ;;
esac

bash "$SCRIPT_DIR/update-runtime.sh"

deploy_target() {
  stack="$1"
  if [ "$MODE" = "reinstall" ]; then
    bash "$SCRIPT_DIR/deploy.sh" "$stack" --reinstall
  else
    bash "$SCRIPT_DIR/deploy.sh" "$stack" up
  fi
}

deploy_target "$TARGET"
bash "$SCRIPT_DIR/smoke-test.sh"

echo "CODEXSUN setup completed: mode=$MODE target=$TARGET"
