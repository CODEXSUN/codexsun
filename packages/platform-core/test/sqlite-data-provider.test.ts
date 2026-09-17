import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "kysely";
import { createSqliteDataProvider } from "../src/index.js";

interface TestDatabase {
  records: {
    id: string;
    label: string;
  };
}

test("creates an isolated SQLite database with required local settings", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();

  const foreignKeys = await sql<{ foreign_keys: number }>`PRAGMA foreign_keys`.execute(database);

  assert.equal(foreignKeys.rows[0]?.foreign_keys, 1);
  await provider.destroy();
});

test("commits and rolls back real SQLite records through the Platform provider", async () => {
  const provider = createSqliteDataProvider<TestDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await database.schema
    .createTable("records")
    .addColumn("id", "text", (column) => column.primaryKey())
    .addColumn("label", "text", (column) => column.notNull())
    .execute();

  await provider.executeWithDatabase(async (transaction) => {
    await transaction.insertInto("records").values({ id: "one", label: "Committed" }).execute();
  });
  await assert.rejects(
    () =>
      provider.executeWithDatabase(async (transaction) => {
        await transaction.insertInto("records").values({ id: "two", label: "Rolled back" }).execute();
        throw new Error("expected");
      }),
    /expected/u,
  );

  const records = await database.selectFrom("records").selectAll().orderBy("id").execute();
  assert.deepEqual(
    records.map(({ id, label }) => ({ id, label })),
    [{ id: "one", label: "Committed" }],
  );
  await provider.destroy();
});

test("rejects an empty SQLite filename", () => {
  assert.throws(() => createSqliteDataProvider<TestDatabase>({ filename: " " }), /requires a database filename/u);
});
