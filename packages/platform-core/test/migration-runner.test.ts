import assert from "node:assert/strict";
import test from "node:test";
import type { Kysely } from "kysely";
import {
  createLifecycleChecksum,
  createSqliteDataProvider,
  MigrationRunner,
  type DatabaseLifecyclePlan,
  type DatabaseMigration,
} from "../src/index.js";

interface TestDatabase {
  example_records: { id: string; value: string };
}

test("runs migrations and repeat-safe seeders serially with recorded checksums", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  const runner = new MigrationRunner(database, () => new Date("2026-09-17T00:00:00.000Z"));

  assert.deepEqual(await runner.run(plan([createRecordsMigration])), ["test.records.001"]);
  assert.deepEqual(await runner.run(plan([createRecordsMigration])), []);
  assert.deepEqual(await runner.run(plan([createRecordsMigration, addSecondRecordMigration])), ["test.records.002"]);
  assert.equal(await recordCount(database), 3);

  const records = await runner.verify(plan([createRecordsMigration, addSecondRecordMigration]));
  const seeder = records.find((record) => record.kind === "seeder");
  assert.equal(seeder?.runCount, 3);
  assert.deepEqual(
    records.filter((record) => record.kind === "migration").map((record) => record.descriptorId),
    ["test.records.001", "test.records.002"],
  );
  await provider.destroy();
});

test("rejects changed checksums and reordered applied migrations", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const runner = new MigrationRunner(provider.queryDatabase());
  await runner.run(plan([createRecordsMigration, addSecondRecordMigration]));

  const changed = { ...createRecordsMigration, checksum: createLifecycleChecksum("changed historical migration") };
  await assert.rejects(runner.run(plan([changed, addSecondRecordMigration])), /checksum changed/u);
  await assert.rejects(runner.run(plan([addSecondRecordMigration, createRecordsMigration])), /history changed/u);
  await provider.destroy();
});

test("adopts legacy migration records without rerunning schema changes", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await createRecordsMigration.apply(database);
  await database.schema
    .createTable("platform_migration_state")
    .addColumn("id", "varchar(160)", (column) => column.primaryKey())
    .addColumn("owner", "varchar(160)", (column) => column.notNull())
    .addColumn("applied_at", "varchar(40)", (column) => column.notNull())
    .execute();
  await database
    .insertInto("platform_migration_state" as never)
    .values({ applied_at: "2026-09-16T00:00:00.000Z", id: createRecordsMigration.id, owner: "test.records" } as never)
    .execute();

  const runner = new MigrationRunner(database);
  assert.deepEqual(await runner.run(plan([createRecordsMigration])), []);
  const records = await runner.verify(plan([createRecordsMigration]));
  assert.equal(records.find((record) => record.kind === "migration")?.checksum, createRecordsMigration.checksum);
  await provider.destroy();
});

const createRecordsMigration: DatabaseMigration<TestDatabase> = {
  checksum: createLifecycleChecksum(
    "test.records.001|example_records:id text primary key,value text not null|insert initial record",
  ),
  description: "Create the example records table and initial migration row.",
  id: "test.records.001",
  owner: "test.records",
  async apply(database) {
    await database.schema
      .createTable("example_records")
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .execute();
    await database.insertInto("example_records").values({ id: "migration-one", value: "initial" }).execute();
  },
};

const addSecondRecordMigration: DatabaseMigration<TestDatabase> = {
  checksum: createLifecycleChecksum("test.records.002|insert migration-two upgrade record"),
  description: "Add the second migration record.",
  id: "test.records.002",
  owner: "test.records",
  async apply(database) {
    await database.insertInto("example_records").values({ id: "migration-two", value: "upgrade" }).execute();
  },
};

function plan(migrations: readonly DatabaseMigration<TestDatabase>[]): DatabaseLifecyclePlan<TestDatabase> {
  return {
    migrations,
    moduleId: "test.records",
    seeders: [
      {
        checksum: createLifecycleChecksum("test.records.seed.001|insert seed when missing"),
        description: "Insert the repeat-safe seed record.",
        id: "test.records.seed.001",
        owner: "test.records",
        async seed(database) {
          const existing = await database
            .selectFrom("example_records")
            .select("id")
            .where("id", "=", "seed")
            .executeTakeFirst();
          if (!existing)
            await database.insertInto("example_records").values({ id: "seed", value: "default" }).execute();
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
