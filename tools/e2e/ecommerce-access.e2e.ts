import assert from "node:assert/strict";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";

assert.equal(env.NODE_ENV, "development", "Run only against an isolated development tenant");
assert.ok(env.DB_MASTER_NAME.startsWith("codexsun_dev_"));
assert.ok(env.DEFAULT_TENANT_DB_NAME.startsWith("codexsun_dev_"));
const origin = new URL(env.PLATFORM_WEB_ORIGIN);
origin.port = String(env.PLATFORM_WEB_PORT);
const base = `${origin.origin}/api/platform`;
const login = await fetch(`${base}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: origin.origin },
  body: JSON.stringify({
    desk: "tenant",
    corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
    email: env.DEFAULT_TENANT_ADMIN_EMAIL,
    password: env.DEFAULT_TENANT_ADMIN_PASSWORD
  })
});
assert.equal(login.status, 200);
const session = await login.json();
const headers = {
  cookie: login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; "),
  "x-codexsun-session-slot": session.data.sessionSlot,
  origin: origin.origin
};
const db = await createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DEFAULT_TENANT_DB_NAME
});
try {
  const publicAccess = await fetch(`${base}/ecommerce/overview`, {
    headers: { "x-tenant-db": env.DEFAULT_TENANT_DB_NAME }
  });
  assert.equal(publicAccess.status, 401);
  const connected = await fetch(`${base}/ecommerce/overview`, { headers });
  assert.equal(connected.status, 200);
  const overview = (await connected.json()).data;
  assert.equal(overview.appKey, "ecommerce");
  assert.equal(overview.actorEmail, env.DEFAULT_TENANT_ADMIN_EMAIL);
  const forged = await fetch(`${base}/ecommerce/overview`, {
    headers: { ...headers, "x-tenant-id": "forged-tenant", "x-tenant-db": env.DB_MASTER_NAME }
  });
  assert.equal(forged.status, 200);
  assert.equal((await forged.json()).data.tenantCode, overview.tenantCode);
  await db.execute("UPDATE app_module_settings SET enabled=FALSE WHERE module_key='ecommerce'");
  try {
    const disabled = await fetch(`${base}/ecommerce/overview`, { headers });
    assert.equal(disabled.status, 403);
  } finally {
    await db.execute("UPDATE app_module_settings SET enabled=TRUE WHERE module_key='ecommerce'");
  }
  await db.execute(
    "UPDATE app_permissions SET status='inactive' WHERE `key`='ecommerce.overview.view'"
  );
  try {
    const denied = await fetch(`${base}/ecommerce/overview`, { headers });
    assert.equal(denied.status, 403);
  } finally {
    await db.execute(
      "UPDATE app_permissions SET status='active' WHERE `key`='ecommerce.overview.view'"
    );
  }
  console.log(
    "Ecommerce access passed: active session, live tenant, forged headers ignored, disabled app and missing permission rejected."
  );
} finally {
  await db.end();
}
