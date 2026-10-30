import assert from "node:assert/strict";
import { createConnection } from "mysql2/promise";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import { env } from "../../apps/platform/api/src/env.js";
import { createApp } from "../../apps/platform/api/src/app.js";
import {
  migrateKnowledgeDatabase,
  seedKnowledgeDatabase,
  type KnowledgeDatabase
} from "@codexsun/docs-api";
assert.equal(env.NODE_ENV, "development");
assert.ok(env.DEFAULT_TENANT_DB_NAME.startsWith("codexsun_dev_"));
assert.ok(env.DB_MASTER_NAME.startsWith("codexsun_dev_"));
assert.equal(env.CODEXSUN_DB_FRESH_ON_START, "0");
const app = await createApp();
const db = await createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DEFAULT_TENANT_DB_NAME
});
const database = new Kysely<KnowledgeDatabase>({
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
let uuid = "";
let original: string | null = null;
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
  assert.equal(login.statusCode, 200);
  slot = login.json().data.sessionSlot;
  const raw = login.headers["set-cookie"];
  cookie = (Array.isArray(raw) ? raw : [raw])
    .filter(Boolean)
    .map((v) => String(v).split(";")[0])
    .join("; ");
  const headers = { host, cookie, "x-codexsun-session-slot": slot, origin: env.PLATFORM_WEB_ORIGIN };
  async function call(
    url: string,
    method: "GET" | "PUT" = "GET",
    payload?: unknown,
    expected = 200
  ) {
    const result = await app.inject({
      method,
      url,
      headers,
      ...(payload !== undefined ? { payload } : {})
    });
    assert.equal(result.statusCode, expected, result.body);
    return result.json().data;
  }
  assert.equal(
    (
      await app.inject({
        method: "GET",
        url: "/docs/knowledge",
        headers: { host, "x-tenant-db": env.DEFAULT_TENANT_DB_NAME }
      })
    ).statusCode,
    401
  );
  const catalog = await call("/docs/knowledge");
  assert.equal(new Set(catalog.pages.map((p: { appKey: string }) => p.appKey)).size, 19);
  assert.ok(catalog.pages.length >= 225);
  assert.equal(catalog.canEdit, true);
  uuid = catalog.pages.find((p: { pageKey: string }) => p.pageKey === "docs/hybrid-model").uuid;
  const [saved] = await db.query(
    "SELECT body_override AS body FROM docs_knowledge_pages WHERE uuid=?",
    [uuid]
  );
  original = (saved as { body: string | null }[])[0]!.body;
  const before = await call(`/docs/knowledge/${uuid}`);
  const forged = await app.inject({
    method: "GET",
    url: `/docs/knowledge/${uuid}`,
    headers: { ...headers, "x-tenant-id": "ffffffff", "x-tenant-db": env.DB_MASTER_NAME }
  });
  assert.equal(forged.statusCode, 200);
  assert.equal(forged.json().data.uuid, uuid);
  await call(`/docs/knowledge/${uuid}`, "PUT", {
    expectedRevision: before.revision,
    body: "# Tenant developer note\n\n| Field | Meaning |\n| --- | --- |\n| Owner | Docs |\n\n<script>window.docsInjected=true</script>"
  });
  const updated = await call(`/docs/knowledge/${uuid}`);
  assert.equal(updated.origin, "database");
  assert.equal(updated.format, "md");
  assert.equal(updated.revision, before.revision + 1);
  assert.ok(updated.activity.some((a: { action: string }) => a.action === "override_saved"));
  await call(
    `/docs/knowledge/${uuid}`,
    "PUT",
    { expectedRevision: before.revision, body: "stale" },
    409
  );
  await call(
    `/docs/knowledge/${uuid}`,
    "PUT",
    { expectedRevision: updated.revision, body: "invalid field", sourcePath: "../../.env" },
    400
  );
  await migrateKnowledgeDatabase(database);
  await migrateKnowledgeDatabase(database);
  await seedKnowledgeDatabase(database);
  assert.equal(
    (await call(`/docs/knowledge/${uuid}`)).body,
    updated.body,
    "Reseed overwrote tenant body"
  );
  await db.query("UPDATE app_permissions SET status='inactive' WHERE `key`='docs.knowledge.edit'");
  try {
    await call(
      `/docs/knowledge/${uuid}`,
      "PUT",
      { expectedRevision: updated.revision, body: "denied" },
      403
    );
  } finally {
    await db.query("UPDATE app_permissions SET status='active' WHERE `key`='docs.knowledge.edit'");
  }
  await db.query("UPDATE app_module_settings SET enabled=FALSE WHERE module_key='docs'");
  try {
    await call("/docs/knowledge", "GET", undefined, 403);
  } finally {
    await db.query("UPDATE app_module_settings SET enabled=TRUE WHERE module_key='docs'");
  }
  const current = await call(`/docs/knowledge/${uuid}`);
  const restored = await call(`/docs/knowledge/${uuid}`, "PUT", {
    expectedRevision: current.revision,
    body: original
  });
  assert.equal(restored.origin, original === null ? "repository" : "database");
  assert.ok(restored.activity.some((a: { action: string }) => a.action === "override_restored"));
  assert.equal(
    (await app.inject({ method: "GET", url: "/zuno/developer-docs?query=billing", headers }))
      .statusCode,
    403
  );
  console.log(
    "Docs E2E passed: 19 app groups, catalog/source resolution, tenant isolation, persisted audited overrides, stale revision protection, safe reseeding, restore and disabled access."
  );
} finally {
  if (uuid) {
    await db.query("UPDATE docs_knowledge_pages SET body_override=? WHERE uuid=?", [
      original,
      uuid
    ]);
  }
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
