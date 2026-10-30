import assert from "node:assert/strict";
import { createConnection } from "mysql2/promise";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import { createApp } from "../../apps/platform/api/src/app.js";
import { env } from "../../apps/platform/api/src/env.js";
import { seedHrmsOverviewPermissions, type HrmsPermissionDatabase } from "@codexsun/hrms-api";
import { seedDocsOverviewPermissions, type DocsPermissionDatabase } from "@codexsun/docs-api";
import { seedHimsxOverviewPermissions, type HimsxPermissionDatabase } from "@codexsun/himsx-api";
import { seedSitesOverviewPermissions, type SitesPermissionDatabase } from "@codexsun/sites-api";
assert.equal(env.NODE_ENV, "development");
assert.ok(env.DB_MASTER_NAME.startsWith("codexsun_dev_") || env.DB_MASTER_NAME.startsWith("codexsun_local_"));
assert.ok(env.DEFAULT_TENANT_DB_NAME.startsWith("codexsun_dev_") || env.DEFAULT_TENANT_DB_NAME.startsWith("codexsun_local_"));
assert.equal(env.CODEXSUN_DB_FRESH_ON_START, "0");
const app = await createApp();
const db = await createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DEFAULT_TENANT_DB_NAME
});
const database = new Kysely<
  HrmsPermissionDatabase & DocsPermissionDatabase & HimsxPermissionDatabase & SitesPermissionDatabase
>({
  dialect: new MysqlDialect({
    pool: createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DEFAULT_TENANT_DB_NAME
    })
  })
});
const host = new URL(env.PLATFORM_WEB_ORIGIN).host;
let slot = "";
let cookie = "";
try {
  await app.ready();
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    headers: { host, origin: env.PLATFORM_WEB_ORIGIN },
    payload: {
      desk: "tenant",
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      email: env.DEFAULT_TENANT_ADMIN_EMAIL,
      password: env.DEFAULT_TENANT_ADMIN_PASSWORD
    }
  });
  assert.equal(login.statusCode, 200, login.body);
  slot = login.json().data.sessionSlot;
  const raw = login.headers["set-cookie"];
  cookie = (Array.isArray(raw) ? raw : [raw])
    .filter(Boolean)
    .map((value) => String(value).split(";")[0])
    .join("; ");
  const headers = { host, cookie, "x-codexsun-session-slot": slot };
  for (const [key, seed] of [
    ["hrms", seedHrmsOverviewPermissions],
    ["docs", seedDocsOverviewPermissions],
    ["himsx", seedHimsxOverviewPermissions],
    ["sites", seedSitesOverviewPermissions]
  ] as const) {
    const permission = `${key}.overview.view`;
    assert.equal(
      (
        await app.inject({
          method: "GET",
          url: `/${key}/overview`,
          headers: { host, "x-tenant-db": env.DEFAULT_TENANT_DB_NAME }
        })
      ).statusCode,
      401
    );
    const response = await app.inject({ method: "GET", url: `/${key}/overview`, headers });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().data.appKey, key);
    assert.equal(response.json().data.actorEmail, env.DEFAULT_TENANT_ADMIN_EMAIL);
    const forged = await app.inject({
      method: "GET",
      url: `/${key}/overview`,
      headers: { ...headers, "x-tenant-id": "ffffffff", "x-tenant-db": env.DB_MASTER_NAME }
    });
    assert.equal(forged.statusCode, 200);
    assert.equal(forged.json().data.tenantCode, response.json().data.tenantCode);
    const [modules] = await db.query(
      "SELECT enabled,status FROM app_module_settings WHERE module_key=?",
      [key]
    );
    const current = (modules as { enabled: number; status: string }[])[0];
    assert.ok(current);
    try {
      await db.query("UPDATE app_module_settings SET enabled=FALSE WHERE module_key=?", [key]);
      assert.equal(
        (await app.inject({ method: "GET", url: `/${key}/overview`, headers })).statusCode,
        403
      );
    } finally {
      await db.query("UPDATE app_module_settings SET enabled=?,status=? WHERE module_key=?", [
        current.enabled,
        current.status,
        key
      ]);
    }
    const [permissions] = await db.query("SELECT status FROM app_permissions WHERE `key`=?", [
      permission
    ]);
    const before = (permissions as { status: string }[])[0]!;
    try {
      await db.query("UPDATE app_permissions SET status='inactive' WHERE `key`=?", [permission]);
      await seed(database);
      await seed(database);
      assert.equal(
        (await app.inject({ method: "GET", url: `/${key}/overview`, headers })).statusCode,
        403,
        "Reseeding reactivated disabled permission"
      );
    } finally {
      await db.query("UPDATE app_permissions SET status=? WHERE `key`=?", [
        before.status,
        permission
      ]);
    }
  }
  const health = (await app.inject({ method: "GET", url: "/health", headers: { host } })).json();
  for (const key of ["hrms", "docs", "himsx", "sites"])
    assert.ok(health.data.checks["platform-api"].details.modules.includes(`${key}.overview`));
  console.log(
    "Tenant app foundations E2E passed: composed routes, login, host/session tenant isolation, disabled apps/permissions rejected and repeatable safe permission seeding."
  );
} finally {
  if (slot)
    await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { host, cookie, "x-codexsun-session-slot": slot, origin: env.PLATFORM_WEB_ORIGIN }
    });
  await database.destroy();
  await db.end();
  await app.close();
}
