import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { runMigrationBatch } from "@codexsun/framework/db";
import { env } from "../../../env.js";
import type { CoreDatabase } from "../../../database/core-database.js";
import { companyFaviconMigration } from "./company.favicon.migration.js";

test("company favicon upgrade preserves an older company and supports repeat saves", async () => {
  assert.equal(env.NODE_ENV, "development");
  const name = `codexsun_company_favicon_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const connection = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  };
  const admin = await createConnection(connection);
  let database: Kysely<CoreDatabase> | undefined;
  try {
    await admin.query(`CREATE DATABASE \`${name}\``);
    database = new Kysely<CoreDatabase>({
      dialect: new MysqlDialect({ pool: createPool({ ...connection, database: name }) })
    });
    await sql`CREATE TABLE core_companies (id INT PRIMARY KEY, name VARCHAR(191), logo_dark_path VARCHAR(255) NULL)`.execute(
      database
    );
    await sql`INSERT INTO core_companies (id,name) VALUES (1,'Original company')`.execute(database);
    const batch = {
      batch: 1,
      description: "Company favicon regression",
      scope: "core",
      version: "1.1.54",
      steps: [companyFaviconMigration]
    };
    assert.equal((await runMigrationBatch(database, batch)).applied.length, 1);
    await sql`UPDATE core_companies SET name='Renamed company',favicon_path=NULL WHERE id=1`.execute(
      database
    );
    assert.equal((await runMigrationBatch(database, batch)).skipped.length, 1);
    const result = await sql<{
      id: number;
      name: string;
      favicon_path: string | null;
    }>`SELECT * FROM core_companies`.execute(database);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.id, 1);
    assert.equal(result.rows[0]?.name, "Renamed company");
    assert.equal(result.rows[0]?.favicon_path, null);
  } finally {
    await database?.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
  }
});
