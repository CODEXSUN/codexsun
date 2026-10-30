import assert from "node:assert/strict";
import test from "node:test";
import { createConnection } from "mysql2/promise";
import { closeCoreDatabase } from "@codexsun/core-api";
import { closeAllBillingDatabases } from "@codexsun/billing-api";
import { closeAllAccountsDatabases } from "@codexsun/accounts-api";
import {
  migrateTenantDatabase,
  seedTenantDatabase
} from "../../apps/platform/api/src/modules/tenant/tenant.seed.js";
import type { Tenant } from "../../apps/platform/api/src/modules/tenant/tenant.types.js";

test("tenant migrations and seeds use the registered server rather than the master server", async () => {
  assert.equal(process.env.CODEXSUN_DISPOSABLE_MIGRATION_FIXTURE, "1");
  assert.equal(process.env.DB_HOST, "127.0.0.1");
  const masterPort = Number(process.env.DB_PORT);
  const tenantPort = Number(process.env.CODEXSUN_TENANT_FIXTURE_PORT);
  assert.ok(masterPort > 1024 && tenantPort > 1024 && masterPort !== tenantPort);
  const connection = { host: "127.0.0.1", user: "root", password: "isolated_routing_test" };
  const master = await createConnection({ ...connection, port: masterPort });
  const target = await createConnection({ ...connection, port: tenantPort });
  const name = "codexsun_routing_fixture";
  const tenant = {
    corporateId: "SANDBOX",
    dbHost: connection.host,
    dbName: name,
    dbPort: tenantPort,
    dbSecretRef: "ROUTING_FIXTURE_PASSWORD",
    dbType: "mariadb",
    dbUser: connection.user,
    defaultLandingApp: "application",
    enabledModuleKeys: ["billing.sales", "accounts.accounting", "hrms"],
    id: 0,
    mobile: null,
    payloadSettings: {},
    primaryDomain: "sandbox.invalid",
    slug: "sandbox",
    status: "active",
    storagePrivateRoot: "",
    storagePublicRoot: "",
    storageRoot: "",
    tenantCode: "SANDBOX",
    tenantName: "Routing fixture",
    uuid: "c0def123"
  } satisfies Tenant;
  try {
    await master.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await target.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await migrateTenantDatabase(tenant);
    await seedTenantDatabase(tenant);
    const [rows] = await target.query<Array<{ TABLE_NAME: string }>>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",
      [name]
    );
    for (const prefix of ["core_", "billing_", "accounts_"]) {
      assert.ok(
        rows.some(({ TABLE_NAME }) => TABLE_NAME.startsWith(prefix)),
        `${prefix} missing on tenant server`
      );
    }
    for (const table of ["hrms_departments", "hrms_designations"]) {
      assert.ok(rows.some(({ TABLE_NAME }) => TABLE_NAME === table), `${table} missing`);
    }
    const [permissions] = await target.query<Array<{ key: string }>>(
      `SELECT \`key\` FROM \`${name}\`.app_permissions WHERE \`key\` IN ('hrms.department.view','hrms.designation.view')`,
    );
    assert.equal(permissions.length, 2, "HRMS master permissions were not seeded");
    const [wrong] = await master.query<Array<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",
      [name]
    );
    assert.equal(
      Number(wrong[0]?.count),
      0,
      "Migration wrote to the same-named master-server database"
    );
    await assert.rejects(
      migrateTenantDatabase({ ...tenant, dbPort: masterPort }),
      /Conflicting (Core|Billing|Accounts) connection/
    );
  } finally {
    await Promise.all([
      closeCoreDatabase(),
      closeAllBillingDatabases(),
      closeAllAccountsDatabases()
    ]);
    await Promise.all([master.end(), target.end()]);
  }
});
