import assert from "node:assert/strict";
import { createConnection } from "mysql2/promise";
import { createApp } from "../../apps/platform/api/src/app.js";
import { env } from "../../apps/platform/api/src/env.js";
import { isSingleTenantMode } from "../../apps/platform/api/src/tenancy-mode.js";

const app = await createApp();

try {
  await app.ready();
  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200, health.body);
  const modules = health.json().data.checks["platform-api"].details.modules as string[];
  for (const key of [
    "ecommerce.catalog.product-information",
    "ecommerce.storefront.public",
    "ecommerce.storefront.profile"
  ]) {
    assert.ok(modules.includes(key), `${key} was not composed into Platform.`);
  }

  const staff = await app.inject({
    headers: { "x-tenant-db": "CODEXSUN_db", "x-tenant-id": "00000000" },
    method: "GET",
    url: "/ecommerce/catalog/product-information"
  });
  assert.equal(staff.statusCode, 401, staff.body);

  const login = await app.inject({
    headers: { host: "app.codexsun.test", origin: env.PLATFORM_WEB_ORIGIN },
    method: "POST",
    payload: {
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      desk: "tenant",
      email: env.DEFAULT_TENANT_ADMIN_EMAIL,
      password: env.DEFAULT_TENANT_ADMIN_PASSWORD
    },
    url: "/auth/login"
  });
  assert.equal(login.statusCode, 200, login.body);
  const sessionSlot = login.json().data.sessionSlot as string;
  const cookie = String(login.headers["set-cookie"]).split(";")[0];
  const staffCatalog = await app.inject({
    headers: {
      cookie,
      host: "app.codexsun.test",
      origin: env.PLATFORM_WEB_ORIGIN,
      "x-codexsun-session-slot": sessionSlot
    },
    method: "GET",
    url: "/ecommerce/catalog/product-information"
  });
  assert.equal(staffCatalog.statusCode, 200, staffCatalog.body);

  const staffHeaders = {
    cookie,
    host: "app.codexsun.test",
    origin: env.PLATFORM_WEB_ORIGIN,
    "x-codexsun-session-slot": sessionSlot
  };
  const dataSource = await app.inject({
    headers: staffHeaders,
    method: "GET",
    url: "/ecommerce/settings/data-source"
  });
  assert.equal(dataSource.statusCode, 200, dataSource.body);
  assert.ok(Array.isArray(dataSource.json().data.modules));
  assert.equal("apiKey" in dataSource.json().data, false);
  const duplicateConnection = await app.inject({
    headers: staffHeaders,
    method: "PUT",
    payload: {},
    url: "/ecommerce/settings/data-source/frappe"
  });
  assert.equal(duplicateConnection.statusCode, 404);

  const unknownHost = await app.inject({
    headers: { host: "unknown.invalid", "x-tenant-db": "CODEXSUN_db" },
    method: "GET",
    url: "/storefront/bootstrap"
  });
  assert.equal(unknownHost.statusCode, isSingleTenantMode() ? 200 : 404, unknownHost.body);

  const publicHost = await app.inject({
    headers: { host: "app.codexsun.test" },
    method: "GET",
    url: "/storefront/bootstrap"
  });
  assert.equal(publicHost.statusCode, 200, publicHost.body);
  const bootstrap = publicHost.json();
  assert.equal(bootstrap.success, true);
  assert.ok(Array.isArray(bootstrap.data.sliders));
  assert.ok(Array.isArray(bootstrap.data.discovery.brands));
  for (const brand of bootstrap.data.discovery.brands as Array<Record<string, unknown>>) {
    assert.equal(typeof brand.logoAlt, "string");
    assert.equal(typeof brand.logoUrl, "string");
  }
  for (const path of [
    "/storefront/catalog",
    "/storefront/categories",
    "/storefront/discovery",
    "/storefront/sliders",
    "/storefront/promotions",
    "/storefront/featured-cards",
    "/storefront/site-navigation",
    "/storefront/branding",
    "/storefront/announcement"
  ]) {
    const response = await app.inject({
      headers: { host: "app.codexsun.test" },
      method: "GET",
      url: path
    });
    assert.equal(response.statusCode, 200, `${path}: ${response.body}`);
  }

  const database = await createConnection({
    database: env.DEFAULT_TENANT_DB_NAME,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  });
  try {
    const [brandColumns] = await database.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='core_brands' AND COLUMN_NAME IN ('logo_url','logo_alt','show_on_storefront')"
    );
    assert.equal(
      (brandColumns as unknown[]).length,
      3,
      "Core brand storefront fields are missing."
    );
    const [oldTables] = await database.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('ecommerce_catalog','ecommerce_catalog_activity','ecommerce_storefront_config','ecommerce_storefront_quotes','ecommerce_storefront_quote_items','ecommerce_storefront_activity')"
    );
    assert.equal((oldTables as unknown[]).length, 0, "Legacy catalog or quote tables remain.");
    const [migration] = await database.query(
      "SELECT status FROM migration_schema WHERE name='ecommerce.modules.legacy-cleanup'"
    );
    assert.equal((migration as Array<{ status: string }>)[0]?.status, "applied");
  } finally {
    await database.end();
  }

  console.log(
    "Ecommerce composition, legacy cleanup, staff protection, tenant resolution, and public reads passed."
  );
} finally {
  await app.close();
}
