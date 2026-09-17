import assert from "node:assert/strict";
import test from "node:test";
import type { Kysely } from "kysely";
import { KyselyDataProvider } from "../src/index.js";

interface TestDatabase {
  records: { readonly id: string };
}

test("commits Kysely work through the Framework transaction contract", async () => {
  const events: string[] = [];
  const database = createDatabase(events);
  const provider = new KyselyDataProvider<TestDatabase>(database);

  const result = await provider.execute(async () => {
    events.push("work");
    return "done";
  });

  assert.equal(result, "done");
  assert.deepEqual(events, ["start", "work", "commit"]);
  assert.equal(provider.queryDatabase(), database);
});

test("rolls back Kysely work through the Framework transaction contract", async () => {
  const events: string[] = [];
  const provider = new KyselyDataProvider<TestDatabase>(createDatabase(events));

  await assert.rejects(
    () =>
      provider.execute(async () => {
        events.push("work");
        throw new Error("expected");
      }),
    /expected/u,
  );

  assert.deepEqual(events, ["start", "work", "rollback"]);
});

test("destroys the Kysely database on provider shutdown", async () => {
  const events: string[] = [];
  const provider = new KyselyDataProvider<TestDatabase>(createDatabase(events));

  await provider.destroy();

  assert.deepEqual(events, ["destroy"]);
});

function createDatabase(events: string[]): Kysely<TestDatabase> {
  const controlledTransaction = {
    commit: () => ({
      execute: async () => {
        events.push("commit");
      },
    }),
    rollback: () => ({
      execute: async () => {
        events.push("rollback");
      },
    }),
  };
  const database = {
    destroy: async () => {
      events.push("destroy");
    },
    startTransaction: () => ({
      execute: async () => {
        events.push("start");
        return controlledTransaction;
      },
    }),
  };

  return database as unknown as Kysely<TestDatabase>;
}
