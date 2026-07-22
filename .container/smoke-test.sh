#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

prepare_deploy_env
validate_deploy_env
require_docker

http_ok() {
  url="$1"
  label="$2"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent --show-error --max-time 15 "$url" >/dev/null
  else
    wget -q -T 15 -O /dev/null "$url"
  fi
  echo "ok $label: $url"
}

bind=$(env_value CODEXSUN_BIND_ADDRESS)

http_ok "http://${bind}:$(env_value PLATFORM_API_HOST_PORT "$(env_value PLATFORM_API_PORT)")/health" platform-api
http_ok "http://${bind}:$(env_value PLATFORM_WEB_HOST_PORT "$(env_value PLATFORM_WEB_PORT)")/health" platform-web
http_ok "http://${bind}:$(env_value MEDIA_HOST_PORT)/" media

docker exec codexsun-redis sh -ec 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping' | grep -qx PONG
echo "ok Redis authenticated connection"

published_port=$(docker port codexsun-mariadb 3306/tcp)
case "$published_port" in
  *":$(env_value MARIADB_HOST_PORT)") ;;
  *) echo "MariaDB is not published on the configured host port: $published_port" >&2; exit 69 ;;
esac
echo "ok MariaDB host port: $published_port"

db_password=$(env_value DB_PASSWORD "")
db_user=$(env_value DB_USER root)
master_db=$(env_value DB_MASTER_NAME cxsun_master_db)
case "$master_db" in
  *[!A-Za-z0-9_]*) echo "Unsafe DB_MASTER_NAME: $master_db" >&2; exit 78 ;;
esac
docker exec -e MYSQL_PWD="$db_password" codexsun-mariadb \
  mariadb --protocol=tcp -h 127.0.0.1 -P 3306 -u "$db_user" \
  --batch --skip-column-names \
  -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$master_db';" \
  | grep -qx 1
echo "ok Platform master database"

docker exec codexsun-billing-api node --input-type=module -e '
  const base = `http://127.0.0.1:${process.env.PLATFORM_API_PORT}`;
  const request = async (path, options = {}) => {
    const response = await fetch(`${base}${path}`, options);
    const body = await response.json();
    if (!response.ok || body.success !== true) {
      throw new Error(`${path} failed with HTTP ${response.status}`);
    }
    return body.data;
  };
  const login = await request("/auth/login", {
    body: JSON.stringify({
      desk: "super_admin",
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  if (!login.accessToken) throw new Error("Super Admin login returned no access token.");
  const headers = { authorization: `Bearer ${login.accessToken}` };
  const session = await request("/auth/session", { headers });
  if (!session.authenticated || session.userType !== "super_admin") {
    throw new Error("Super Admin session validation failed.");
  }
  const apps = await request("/admin/app-operations", { headers });
  const ids = apps.map((app) => app.id).sort().join(",");
  if (ids !== "billing,mail,platform") {
    throw new Error(`Unexpected App Operations bundles: ${ids}`);
  }
  const platform = apps.find((app) => app.id === "platform");
  if (platform?.status !== "online") {
    throw new Error(`Platform services are not fully online: ${platform?.status ?? "missing"}`);
  }
'
echo "ok authenticated Super Admin session and App Operations"

if [ "$(env_value ENABLE_DEFAULT_TENANT_SEED 0)" = "1" ]; then
  tenant_dbs=$(DEFAULT_TENANTS_JSON="$(env_value DEFAULT_TENANTS_JSON "")" node -e '
    for (const tenant of JSON.parse(process.env.DEFAULT_TENANTS_JSON || "[]")) console.log(tenant.databaseName);
  ')
  for tenant_db in $tenant_dbs; do
    case "$tenant_db" in
      ""|*[!A-Za-z0-9_]*) echo "Unsafe tenant database name: $tenant_db" >&2; exit 78 ;;
    esac
    docker exec -e MYSQL_PWD="$db_password" codexsun-mariadb \
      mariadb --protocol=tcp -h 127.0.0.1 -P 3306 -u "$db_user" \
      --batch --skip-column-names \
      -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$tenant_db';" \
      | grep -qx 1
    enabled_product_apps=$(docker exec -e MYSQL_PWD="$db_password" codexsun-mariadb \
      mariadb --protocol=tcp -h 127.0.0.1 -P 3306 -u "$db_user" \
      --batch --skip-column-names \
      -e "SELECT COUNT(*) FROM \`$tenant_db\`.module_settings WHERE module_key IN ('billing.sales','mail') AND enabled=1;")
    [ "$enabled_product_apps" = "2" ] || { echo "Billing and Mail are not enabled in $tenant_db" >&2; exit 69; }
  done
  echo "ok all seeded tenant databases with Billing and Mail enabled"
fi

echo "CODEXSUN container smoke test passed."
