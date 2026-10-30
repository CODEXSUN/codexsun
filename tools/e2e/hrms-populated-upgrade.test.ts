import assert from "node:assert/strict";
import test from "node:test";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import { closeCoreDatabase } from "@codexsun/core-api";
import { closeAllBillingDatabases } from "@codexsun/billing-api";
import { closeAllAccountsDatabases } from "@codexsun/accounts-api";
import { tconnectTenantMigrations } from "@codexsun/tconnect-api";
import {
  migrateTenantDatabase,
  seedTenantDatabase
} from "../../apps/platform/api/src/modules/tenant/tenant.seed.js";
import type { Tenant } from "../../apps/platform/api/src/modules/tenant/tenant.types.js";

test("populated tenant receives HRMS masters and repeatable permissions", async () => {
  assert.equal(process.env.CODEXSUN_DISPOSABLE_MIGRATION_FIXTURE, "1");
  assert.equal(process.env.DB_HOST, "127.0.0.1");
  assert.equal(process.env.NODE_ENV, "test");
  const port = Number(process.env.DB_PORT);
  assert.ok(Number.isInteger(port) && port > 1024);
  const name = "codexsun_hrms_upgrade_fixture";
  const admin = await createConnection({
    host: "127.0.0.1",
    port,
    user: "root",
    password: "isolated_routing_test"
  });
  const tenant = {
    corporateId: "SANDBOX",
    dbHost: "127.0.0.1",
    dbName: name,
    dbPort: port,
    dbSecretRef: "DB_PASSWORD",
    dbType: "mariadb",
    dbUser: "root",
    defaultLandingApp: "application",
    enabledModuleKeys: ["hrms"],
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
    tenantName: "HRMS fixture",
    uuid: "c0def123"
  } satisfies Tenant;
  try {
    await admin.query(
      `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await seedTenantDatabase(tenant);
    const [tconnectLedger] = await admin.query<RowDataPacket[]>(
      `SELECT name FROM \`${name}\`.migration_schema WHERE scope='tconnect' AND status='applied' ORDER BY id`
    );
    assert.deepEqual(
      tconnectLedger.map((row) => row.name),
      tconnectTenantMigrations.map(({ name }) => name)
    );
    await admin.query(
      `INSERT INTO \`${name}\`.core_companies (uuid,code,name) VALUES ('fc0de001','HRMSFIXTURE','Existing company')`
    );
    await admin.query(
      `DROP TABLE \`${name}\`.hrms_department_activity, \`${name}\`.hrms_departments, \`${name}\`.hrms_designation_activity, \`${name}\`.hrms_designations`
    );
    await admin.query(
      `DELETE FROM \`${name}\`.migration_schema WHERE scope IN ('hrms.department','hrms.designation')`
    );
    await admin.query(
      `DELETE FROM \`${name}\`.app_role_permissions WHERE permission_id IN (SELECT id FROM \`${name}\`.app_permissions WHERE \`key\` LIKE 'hrms.department.%' OR \`key\` LIKE 'hrms.designation.%')`
    );
    await admin.query(
      `DELETE FROM \`${name}\`.app_permissions WHERE \`key\` LIKE 'hrms.department.%' OR \`key\` LIKE 'hrms.designation.%'`
    );
    const [before] = await admin.query<RowDataPacket[]>(
      `SELECT scope,name,version,checksum FROM \`${name}\`.migration_schema ORDER BY scope,name`
    );
    await migrateTenantDatabase(tenant);
    await seedTenantDatabase(tenant);
    const [permissions] = await admin.query<RowDataPacket[]>(
      `SELECT \`key\`,status FROM \`${name}\`.app_permissions WHERE \`key\` LIKE 'hrms.department.%' OR \`key\` LIKE 'hrms.designation.%' ORDER BY \`key\``
    );
    assert.equal(permissions.length, 8);
    const [grants] = await admin.query<RowDataPacket[]>(
      `SELECT p.\`key\`,r.role_id,r.status FROM \`${name}\`.app_role_permissions r JOIN \`${name}\`.app_permissions p ON p.id=r.permission_id WHERE p.\`key\` LIKE 'hrms.department.%' OR p.\`key\` LIKE 'hrms.designation.%' ORDER BY p.\`key\`,r.role_id`
    );
    assert.equal(grants.length, 8);
    await seedTenantDatabase(tenant);
    const [again] = await admin.query<RowDataPacket[]>(
      `SELECT \`key\`,status FROM \`${name}\`.app_permissions WHERE \`key\` LIKE 'hrms.department.%' OR \`key\` LIKE 'hrms.designation.%' ORDER BY \`key\``
    );
    assert.deepEqual(again, permissions);
    const [againGrants] = await admin.query<RowDataPacket[]>(
      `SELECT p.\`key\`,r.role_id,r.status FROM \`${name}\`.app_role_permissions r JOIN \`${name}\`.app_permissions p ON p.id=r.permission_id WHERE p.\`key\` LIKE 'hrms.department.%' OR p.\`key\` LIKE 'hrms.designation.%' ORDER BY p.\`key\`,r.role_id`
    );
    assert.deepEqual(againGrants, grants);
    const [after] = await admin.query<RowDataPacket[]>(
      `SELECT scope,name,version,checksum FROM \`${name}\`.migration_schema WHERE scope NOT IN ('hrms.department','hrms.designation') ORDER BY scope,name`
    );
    assert.deepEqual(after, before);
    const [company] = await admin.query<RowDataPacket[]>(
      `SELECT name FROM \`${name}\`.core_companies WHERE uuid='fc0de001'`
    );
    assert.equal(company[0]?.name, "Existing company");
  } finally {
    await Promise.all([
      closeCoreDatabase(),
      closeAllBillingDatabases(),
      closeAllAccountsDatabases()
    ]);
    await admin.end();
  }
});
