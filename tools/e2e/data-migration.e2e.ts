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
    `codexsun_mig_master_${suffix}`
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
    await migrateDataMigrationDatabase(database);
    await migrateDataMigrationDatabase(database);
    const source = await createConnection({ ...config, database: names[0] });
    const target = await createConnection({ ...config, database: names[1] });
    try {
      await source.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await target.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
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
      } finally {
        await api.close();
      }
      assert.equal((await service.listSources())[0]?.label, "External test database");
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
        )
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
      await assert.rejects(service.copy(sourceId, 2, "sample", "test@codexsun.app"), /empty/u);
      assert.equal((await service.listRuns())[0]?.status, "completed");

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
      assert.equal((await service.verifySource(sourceId, "test@codexsun.app")).verified, true);
      await service.deactivateSource(sourceId, "test@codexsun.app");
      assert.equal((await service.listSources()).length, 0);
      await assert.rejects(service.listTables(sourceId), /not found/u);
    } finally {
      await Promise.all([source.end(), target.end()]);
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
    assert.equal(reads.statusCode, 403);
    assert.equal(writes.statusCode, 403);
    assert.equal(settingsWrite.statusCode, 403);
    assert.equal(databases.statusCode, 403);
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
    listTenants: async () => [{ id: 2, label: "Target" }],
    async resolveTenant(id) {
      if (id !== 2) throw new Error("Unknown tenant.");
      return { id, label: "Target", database: names[1]!, ...config };
    }
  };
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
