import assert from "node:assert/strict";
import test from "node:test";
import type { Kysely } from "kysely";
import { MigrationRunner, createSqliteDataProvider, type DatabaseLifecyclePlan } from "../src/index.js";

interface TestDatabase {
  example_records: { id: string; value: string };
}

test("runs clean and upgrade migrations once, then repeats seeders safely", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  const runner = new MigrationRunner(database, () => new Date("2026-09-17T00:00:00.000Z"));

  const clean = await runner.run(plan(database, [createRecordsMigration]));
  assert.deepEqual(clean, ["test.records.001"]);
  assert.equal(await recordCount(database), 1);

  const repeat = await runner.run(plan(database, [createRecordsMigration]));
  assert.deepEqual(repeat, []);
  assert.equal(await recordCount(database), 1);

  const upgraded = await runner.run(plan(database, [createRecordsMigration, addSecondRecordMigration]));
  assert.deepEqual(upgraded, ["test.records.002"]);
  assert.equal(await recordCount(database), 2);
  await provider.destroy();
});

const createRecordsMigration = {
  id: "test.records.001",
  owner: "test.records",
  async apply(database: Kysely<TestDatabase>): Promise<void> {
    await database.schema
      .createTable("example_records")
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .execute();
  },
};

const addSecondRecordMigration = {
  id: "test.records.002",
  owner: "test.records",
  async apply(database: Kysely<TestDatabase>): Promise<void> {
    await database.insertInto("example_records").values({ id: "migration", value: "upgrade" }).execute();
  },
};

function plan(
  database: Kysely<TestDatabase>,
  migrations: DatabaseLifecyclePlan<TestDatabase>["migrations"],
): DatabaseLifecyclePlan<TestDatabase> {
  return {
    moduleId: "test.records",
    migrations,
    seeders: [
      {
        id: "test.records.seed.001",
        owner: "test.records",
        async seed() {
          await database
            .insertInto("example_records")
            .values({ id: "seed", value: "default" })
            .onConflict((conflict) => conflict.column("id").doNothing())
            .execute();
        },
      },
    ],
  };
}

async function recordCount(database: Kysely<TestDatabase>): Promise<number> {
  const result = await database
    .selectFrom("example_records")
    .select((expression) => expression.fn.count("id").as("count"))
    .executeTakeFirstOrThrow();
  return Number(result.count);
}
