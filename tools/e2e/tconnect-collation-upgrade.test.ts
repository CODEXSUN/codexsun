import assert from "node:assert/strict";
import test from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import { migrateTconnect, seedTconnect } from "@codexsun/tconnect-api";
import { runMigrationBatch } from "@codexsun/framework/db";
import { migrateAssociation } from "../../apps/tconnect/api/src/modules/association/association.migration.js";
import { migrateCompany } from "../../apps/tconnect/api/src/modules/company/company.migration.js";
import { migrateCommunity } from "../../apps/tconnect/api/src/modules/community/community.migration.js";
import { migrateInquiry } from "../../apps/tconnect/api/src/modules/inquiry/inquiry.migration.js";

test("Tconnect upgrades populated mixed-collation parents without changing their data", async () => {
  assert.equal(process.env.CODEXSUN_DISPOSABLE_MIGRATION_FIXTURE, "1");
  assert.equal(process.env.NODE_ENV, "test");
  assert.equal(process.env.DB_HOST, "127.0.0.1");
  const port = Number(process.env.DB_PORT);
  assert.ok(Number.isInteger(port) && port > 1024);
  const settings = { host: "127.0.0.1", port, user: "root", password: "isolated_routing_test" };
  const admin = await createConnection(settings);
  const name = "codexsun_tconnect_collation_fixture";
  await admin.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`
  );
  const db = new Kysely<any>({
    dialect: new MysqlDialect({ pool: createPool({ ...settings, database: name }) })
  });
  try {
    await sql`CREATE TABLE app_users (id INT PRIMARY KEY, uuid CHAR(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE)`.execute(
      db
    );
    await sql`CREATE TABLE app_permissions (id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, \`key\` VARCHAR(191) NOT NULL UNIQUE, label VARCHAR(191) NOT NULL, description TEXT NOT NULL, status VARCHAR(24) NOT NULL, is_protected BOOLEAN NOT NULL)`.execute(
      db
    );
    await sql`CREATE TABLE app_roles (id INT PRIMARY KEY, \`key\` VARCHAR(191) NOT NULL UNIQUE)`.execute(
      db
    );
    await sql`INSERT INTO app_roles VALUES (1,'admin')`.execute(db);
    await sql`CREATE TABLE app_role_permissions (id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, role_id INT NOT NULL, permission_id INT NOT NULL, status VARCHAR(24) NOT NULL, is_protected BOOLEAN NOT NULL, UNIQUE KEY role_permission (role_id,permission_id))`.execute(
      db
    );
    await runMigrationBatch(db, {
      batch: 1,
      scope: "tconnect",
      version: "1.1.2",
      description: "TConnect business network",
      steps: [
        {
          name: "tconnect.directory.v1",
          description: "Install TConnect tables",
          checksum: "tconnect.directory.v1",
          version: 1,
          up: async (database) => {
            await migrateAssociation(database);
            await migrateCompany(database);
            await migrateCommunity(database);
            await migrateInquiry(database);
          }
        }
      ]
    });
    const oldLedger =
      await sql`SELECT scope,name,version,checksum FROM migration_schema WHERE scope='tconnect'`.execute(
        db
      );
    await sql`INSERT INTO tconnect_associations (uuid,name,slug,tagline,description,industry,city,color,initials) VALUES ('abcd0001','Existing association','fixture','tag','description','industry','city','#123456','EA')`.execute(
      db
    );
    await sql`INSERT INTO tconnect_companies (uuid,name,slug,tagline,description,industry,city,color,initials,role,products,capacity,established,associationUuid,website) VALUES ('abcd0002','Existing company','company','tag','description','industry','city','#123456','EC','seller','products','capacity',2020,'abcd0001','')`.execute(
      db
    );
    const before = await sql`SELECT * FROM tconnect_companies`.execute(db);
    const associations = await sql`SELECT * FROM tconnect_associations`.execute(db);
    await migrateTconnect(db);
    await seedTconnect(db);
    const permissions = await sql`SELECT * FROM app_permissions ORDER BY id`.execute(db);
    const grants = await sql`SELECT * FROM app_role_permissions ORDER BY id`.execute(db);
    const first =
      await sql`SELECT scope,name,version,checksum FROM migration_schema WHERE scope='tconnect' ORDER BY id`.execute(
        db
      );
    assert.deepEqual(first.rows.slice(0, 1), oldLedger.rows);
    await migrateTconnect(db);
    await seedTconnect(db);
    assert.deepEqual(
      (await sql`SELECT * FROM app_permissions ORDER BY id`.execute(db)).rows,
      permissions.rows
    );
    assert.deepEqual(
      (await sql`SELECT * FROM app_role_permissions ORDER BY id`.execute(db)).rows,
      grants.rows
    );
    const second =
      await sql`SELECT scope,name,version,checksum FROM migration_schema WHERE scope='tconnect' ORDER BY id`.execute(
        db
      );
    assert.deepEqual(second.rows, first.rows);
    const companies = (await sql`SELECT * FROM tconnect_companies`.execute(db)).rows;
    assert.deepEqual(
      companies.map(({ logoDataUrl: _added, ...original }) => original),
      before.rows
    );
    assert.deepEqual(
      (await sql`SELECT * FROM tconnect_associations`.execute(db)).rows,
      associations.rows
    );
    const [columns] = await admin.query<RowDataPacket[]>(
      "SELECT TABLE_NAME,COLUMN_NAME,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND ((TABLE_NAME='tconnect_members' AND COLUMN_NAME IN ('user_uuid','company_uuid','requested_association_uuid')) OR (TABLE_NAME='tconnect_credentials' AND COLUMN_NAME='company_uuid'))",
      [name]
    );
    assert.equal(columns.length, 4);
    assert.ok(
      columns.find(
        (column) => column.TABLE_NAME === "tconnect_members" && column.COLUMN_NAME === "user_uuid"
      )?.COLLATION_NAME === "utf8mb4_unicode_ci"
    );
    assert.ok(
      columns
        .find(
          (column) =>
            column.TABLE_NAME === "tconnect_members" && column.COLUMN_NAME === "company_uuid"
        )
        ?.COLLATION_NAME.includes("uca1400")
    );
  } finally {
    await db.destroy();
    await admin.end();
  }
});
