import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { registerDataMigrationApi } from "../../devkits/data-migration/api/src/app.js";
import { migrateDataMigrationDatabase } from "../../devkits/data-migration/api/src/modules/migration/migration.migration.js";
import { MigrationService } from "../../devkits/data-migration/api/src/modules/migration/migration.service.js";
import type { DataMigrationHost } from "../../devkits/data-migration/api/src/modules/migration/migration.types.js";

test("copies an empty compatible table and rolls back a failed transfer", async () => {
  const suffix = randomBytes(5).toString("hex");
  const names = [
    `codexsun_mig_source_${suffix}`,
    `codexsun_mig_target_${suffix}`,
    `codexsun_mig_master_${suffix}`,
    `codexsun_mig_job_target_${suffix}`
  ];
  const config = {
    host: required("DB_HOST"),
    port: Number(required("DB_PORT")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD")
  };
  const admin = await createConnection(config);
  let database: Kysely<unknown> | null = null;
  try {
    for (const name of names) await admin.query(`CREATE DATABASE \`${name}\``);
    database = new Kysely<unknown>({
      dialect: new MysqlDialect({ pool: createPool({ ...config, database: names[2] }) })
    });
    await sqlAdmin(
      admin,
      names[2]!,
      "CREATE TABLE tenants (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB"
    );
    await sqlAdmin(admin, names[2]!, "INSERT INTO tenants (id) VALUES (2), (3)");
    await migrateDataMigrationDatabase(database);
    await migrateDataMigrationDatabase(database);
    const source = await createConnection({ ...config, database: names[0] });
    const target = await createConnection({ ...config, database: names[1] });
    const jobTarget = await createConnection({ ...config, database: names[3] });
    try {
      await source.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await target.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await jobTarget.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await source.query("INSERT INTO sample VALUES (1, 'first'), (2, 'second')");
      const service = new MigrationService(host(database, names, config));
      await assert.rejects(
        service.addSource(
          {
            label: "Master",
            database: names[2]!,
            tlsMode: "disabled",
            ...config
          },
          "test@codexsun.app"
        ),
        /master database/u
      );
      await assert.rejects(
        service.addSource(
          { label: "System", database: "mysql", tlsMode: "disabled", ...config },
          "test@codexsun.app"
        ),
        /system database/u
      );
      const { id: sourceId } = await service.addSource(
        {
          label: "External test database",
          database: "",
          tlsMode: "disabled",
          ...config
        },
        "test@codexsun.app"
      );
      await assert.rejects(service.listTables(sourceId), /Select a source database/u);
      const databases = await service.listDatabases(sourceId);
      assert.ok(databases.includes(names[0]!));
      assert.ok(databases.includes(names[1]!));
      assert.ok(!databases.includes(names[2]!));
      assert.ok(!databases.includes("mysql"));
      assert.ok(!databases.includes("information_schema"));
      const api = Fastify();
      try {
        await registerDataMigrationApi(api, host(database, names, config));
        const response = await api.inject({
          method: "GET",
          url: `/api/data-migration/sources/${sourceId}/databases`
        });
        assert.equal(response.statusCode, 200);
        assert.ok((response.json().data as string[]).includes(names[0]!));
        const updateResponse = await api.inject({
          method: "PUT",
          url: `/api/data-migration/sources/${sourceId}`,
          payload: {
            label: "Updated external source",
            host: config.host,
            port: config.port,
            database: names[0],
            user: config.user,
            tlsMode: "disabled"
          }
        });
        assert.equal(updateResponse.statusCode, 200, updateResponse.body);
      } finally {
        await api.close();
      }
      assert.equal((await service.listSources())[0]?.label, "Updated external source");
      assert.equal(JSON.stringify(await service.listSources()).includes(config.password), false);
      const [secrets] = await admin.query<RowDataPacket[]>(
        `SELECT password_ciphertext FROM \`${names[2]}\`.data_migration_sources WHERE id = ?`,
        [sourceId]
      );
      assert.notEqual(secrets[0]?.password_ciphertext, config.password);
      await service.updateSource(
        sourceId,
        {
          label: "Updated external source",
          database: names[0]!,
          tlsMode: "disabled",
          host: config.host,
          port: config.port,
          user: config.user
        },
        "test@codexsun.app"
      );
      assert.equal((await service.listSources())[0]?.label, "Updated external source");
      await assert.rejects(
        service.updateSource(
          sourceId,
          {
            label: "Master source",
            database: names[2]!,
            tlsMode: "disabled",
            host: config.host,
            port: config.port,
            user: config.user
          },
          "test@codexsun.app"
        ),
        /master database/u
      );
      await assert.rejects(
        service.updateSource(
          sourceId,
          {
            label: "Invalid port",
            database: names[0]!,
            tlsMode: "disabled",
            host: config.host,
            port: 1,
            user: config.user
          },
          "test@codexsun.app"
        ),
        /refused the connection/u
      );
      assert.equal((await service.listSources())[0]?.port, config.port);
      assert.deepEqual(await service.listTables(sourceId), ["sample"]);
      assert.deepEqual(await service.preview(sourceId, 2, "sample"), {
        table: "sample",
        sourceRows: 2,
        targetRows: 0,
        compatible: true,
        reason: null
      });
      assert.equal((await service.copy(sourceId, 2, "sample", "test@codexsun.app")).copiedRows, 2);
      assert.equal(await count(target, "sample"), 2);
      assert.equal((await service.listRuns())[0]?.status, "completed");
      await assert.rejects(service.copy(sourceId, 2, "sample", "test@codexsun.app"), /empty/u);
      assert.equal((await service.listRuns())[0]?.status, "failed");

      await source.query(
        "CREATE TABLE rollback_sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE rollback_sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL, CONSTRAINT allowed_label CHECK (label <> 'blocked'))"
      );
      await source.query("INSERT INTO rollback_sample VALUES (1, 'allowed'), (2, 'blocked')");
      await assert.rejects(service.copy(sourceId, 2, "rollback_sample", "test@codexsun.app"));
      assert.equal(await count(target, "rollback_sample"), 0);
      assert.equal((await service.listRuns())[0]?.status, "failed");

      await source.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, old_label VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, new_label VARCHAR(32) NOT NULL, note VARCHAR(24) NOT NULL DEFAULT 'local')"
      );
      await jobTarget.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, new_label VARCHAR(32) NOT NULL, note VARCHAR(24) NOT NULL DEFAULT 'local')"
      );
      await source.query("INSERT INTO mapped_sample VALUES (1, 'first'), (2, 'second')");
      const mapping = [
        { sourceColumn: "id", targetColumn: "id" },
        { sourceColumn: "old_label", targetColumn: "new_label" }
      ];
      const mappedPreview = await service.preview(sourceId, 2, "mapped_sample", mapping);
      assert.equal(mappedPreview.compatible, true);
      assert.equal(
        (await service.copy(sourceId, 2, "mapped_sample", "test@codexsun.app", mapping)).copiedRows,
        2
      );
      const [mappedRows] = await target.query<RowDataPacket[]>(
        "SELECT * FROM mapped_sample ORDER BY id"
      );
      assert.deepEqual(mappedRows, [
        { id: 1, new_label: "first", note: "local" },
        { id: 2, new_label: "second", note: "local" }
      ]);
      assert.equal(await count(source, "mapped_sample"), 2);
      await service.savePlan(sourceId, 2, "mapped_sample", mapping, "test@codexsun.app");
      assert.deepEqual(await service.getPlan(sourceId, 2), [
        { table: "mapped_sample", columnMappings: mapping }
      ]);
      await source.query(
        "CREATE TABLE old_accounts (legacy_id INT NOT NULL, legacy_name VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE new_accounts (id INT NOT NULL, display_name VARCHAR(32) NOT NULL)"
      );
      await source.query("INSERT INTO old_accounts VALUES (1, 'Sukraa')");
      const { id: jobId } = await service.createJob(
        { sessionName: "Sukraa job", sourceId, sourceTenantId: null, targetTenantId: 2 },
        "test@codexsun.app"
      );
      await service.renameJob(jobId, "Sukraa migration", "test@codexsun.app");
      await service.saveJobTable(
        jobId,
        {
          sourceTable: "old_accounts",
          targetTable: "new_accounts",
          mappings: [
            { sourceColumn: "legacy_id", targetColumn: "id" },
            { sourceColumn: "legacy_name", targetColumn: "display_name" }
          ]
        },
        "test@codexsun.app"
      );
      const job = (await service.listJobs()).find((item) => item.id === jobId);
      assert.equal(job?.sessionName, "Sukraa migration");
      assert.equal(job?.sourceDatabase, names[0]);
      assert.equal(job?.targetDatabase, names[1]);
      assert.equal(job?.tableCount, 1);
      const jobTables = await service.getJobTables(jobId);
      assert.equal(jobTables[0]?.sourceTable, "old_accounts");
      assert.equal(jobTables[0]?.targetTable, "new_accounts");
      assert.equal(jobTables[0]?.sourceRows, 1);
      assert.equal(jobTables[0]?.targetRows, 0);
      assert.equal(jobTables[0]?.mappingStatus, "mapped");
      assert.equal(jobTables[0]?.migrationStatus, "pending");
      assert.equal(jobTables[0]?.columnMappings[0]?.by, "test@codexsun.app");
      assert.ok(jobTables[0]?.columnMappings[0]?.id);
      assert.equal(await count(source, "old_accounts"), 1);
      await jobTarget.query(
        "CREATE TABLE new_accounts (id INT NOT NULL, display_name VARCHAR(32) NOT NULL)"
      );
      await source.query("DROP TABLE old_accounts");
      await source.query("DROP TABLE rollback_sample");
      await target.query("DROP TABLE rollback_sample");
      await target.query("TRUNCATE TABLE sample");
      await target.query("TRUNCATE TABLE mapped_sample");
      const sampleMapping = [
        { sourceColumn: "id", targetColumn: "id" },
        { sourceColumn: "label", targetColumn: "label" }
      ];
      await service.savePlan(sourceId, 2, "sample", sampleMapping, "test@codexsun.app");
      await target.query(
        "CREATE TRIGGER fail_sample_insert BEFORE INSERT ON sample FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'planned batch failure'"
      );
      await assert.rejects(
        service.migratePlan(sourceId, 2, "test@codexsun.app"),
        /planned batch failure/u
      );
      assert.equal(await count(target, "mapped_sample"), 0);
      assert.equal(await count(target, "sample"), 0);
      await target.query("DROP TRIGGER fail_sample_insert");
      const batch = await service.migratePlan(sourceId, 2, "test@codexsun.app");
      assert.equal(batch.completed.length, 2);
      assert.equal(batch.copiedRows, 4);
      assert.equal(await count(source, "sample"), 2);
      assert.equal(await count(source, "mapped_sample"), 2);
      assert.equal(await count(target, "sample"), 2);
      assert.equal(await count(target, "mapped_sample"), 2);
      await source.query(
        "CREATE TABLE old_accounts (legacy_id INT NOT NULL, legacy_name VARCHAR(32) NOT NULL)"
      );
      await source.query("INSERT INTO old_accounts VALUES (1, 'Sukraa')");
      const { id: batchJobId } = await service.createJob(
        { sessionName: "Sukraa migration", sourceId, sourceTenantId: null, targetTenantId: 3 },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        { sourceTable: "sample", targetTable: "sample", mappings: sampleMapping },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        { sourceTable: "mapped_sample", targetTable: "mapped_sample", mappings: mapping },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        {
          sourceTable: "old_accounts",
          targetTable: "new_accounts",
          mappings: [
            { sourceColumn: "legacy_id", targetColumn: "id" },
            { sourceColumn: "legacy_name", targetColumn: "display_name" }
          ]
        },
        "test@codexsun.app"
      );
      const jobBatch = await service.migrateJob(batchJobId, "test@codexsun.app");
      assert.equal(jobBatch.completed.length, 3);
      assert.equal(jobBatch.copiedRows, 5);
      assert.equal(await count(source, "sample"), 2);
      assert.equal(await count(source, "mapped_sample"), 2);
      assert.equal(await count(source, "old_accounts"), 1);
      assert.equal(await count(jobTarget, "sample"), 2);
      assert.equal(await count(jobTarget, "mapped_sample"), 2);
      assert.equal(await count(jobTarget, "new_accounts"), 1);
      assert.equal(
        (await service.getJobTables(batchJobId)).every(
          (item) => item.migrationStatus === "completed"
        ),
        true
      );
      assert.equal((await service.verifySource(sourceId, "test@codexsun.app")).verified, true);
      await service.deactivateSource(sourceId, "test@codexsun.app");
      assert.equal((await service.listSources()).length, 0);
      await assert.rejects(service.listTables(sourceId), /not found/u);
    } finally {
      await Promise.all([source.end(), target.end(), jobTarget.end()]);
    }
  } finally {
    if (database) await database.destroy();
    for (const name of names.reverse()) await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
  }
});

test("denies migration reads and writes before resolving a tenant", async () => {
  const app = Fastify();
  let resolved = false;
  await registerDataMigrationApi(app, {
    database: {} as Kysely<unknown>,
    secretKey: "test-secret",
    masterDatabase: { host: "master.invalid", port: 3306, database: "master" },
    authorize() {
      throw AppError.forbidden("Super Admin required.");
    },
    async listTenants() {
      resolved = true;
      return [];
    },
    async resolveTenant() {
      resolved = true;
      throw new Error("Should not resolve.");
    }
  });
  try {
    const reads = await app.inject({ method: "GET", url: "/api/data-migration/tenants" });
    const writes = await app.inject({
      method: "POST",
      url: "/api/data-migration/runs",
      payload: { sourceId: 1, targetTenantId: 2, table: "sample" }
    });
    const settingsWrite = await app.inject({
      method: "PUT",
      url: "/api/data-migration/sources/1",
      payload: {
        label: "Source",
        host: "localhost",
        port: 3306,
        database: "source",
        user: "admin",
        tlsMode: "disabled"
      }
    });
    const databases = await app.inject({
      method: "GET",
      url: "/api/data-migration/sources/1/databases"
    });
    const planRead = await app.inject({
      method: "POST",
      url: "/api/data-migration/plan/read",
      payload: { sourceId: 1, targetTenantId: 2 }
    });
    const planRun = await app.inject({
      method: "POST",
      url: "/api/data-migration/plan/migrate",
      payload: { sourceId: 1, targetTenantId: 2 }
    });
    assert.equal(reads.statusCode, 403);
    assert.equal(writes.statusCode, 403);
    assert.equal(settingsWrite.statusCode, 403);
    assert.equal(databases.statusCode, 403);
    assert.equal(planRead.statusCode, 403);
    assert.equal(planRun.statusCode, 403);
    assert.equal(resolved, false);
  } finally {
    await app.close();
  }
});

function host(
  database: Kysely<unknown>,
  names: string[],
  config: {
    host: string;
    port: number;
    user: string;
    password: string;
  }
): DataMigrationHost {
  return {
    database,
    secretKey: "test-secret",
    masterDatabase: { host: config.host, port: config.port, database: names[2]! },
    currentDatabase: config,
    authorize: () => "test@codexsun.app",
    listTenants: async () => [
      { id: 2, label: "Target" },
      { id: 3, label: "Job target" }
    ],
    async resolveTenant(id) {
      if (id === 2) return { id, label: "Target", database: names[1]!, ...config };
      if (id === 3) return { id, label: "Job target", database: names[3]!, ...config };
      throw new Error("Unknown tenant.");
    }
  };
}

async function sqlAdmin(admin: Connection, database: string, statement: string) {
  await admin.query(`USE \`${database}\``);
  await admin.query(statement);
}

async function count(connection: Connection, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM \`${table}\``
  );
  return Number(rows[0]?.count);
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the disposable database test.`);
  return value;
}
