import assert from "node:assert/strict";
import test from "node:test";
import {
  executeTransaction,
  type MigrationDescriptor,
  type Repository,
  type Transaction,
  type UnitOfWork,
} from "../src/index.js";

test("commits when transactional work succeeds", async () => {
  const events: string[] = [];
  const transaction = createTransaction(events);

  const result = await executeTransaction(transaction, async (activeTransaction) => {
    assert.equal(activeTransaction, transaction);
    events.push("work");
    return "saved";
  });

  assert.equal(result, "saved");
  assert.deepEqual(events, ["work", "commit"]);
});

test("rolls back when transactional work fails", async () => {
  const events: string[] = [];
  const transaction = createTransaction(events);

  await assert.rejects(
    () =>
      executeTransaction(transaction, async () => {
        events.push("work");
        throw new Error("expected");
      }),
    /expected/u,
  );

  assert.deepEqual(events, ["work", "rollback"]);
});

test("exposes driver-neutral repository, unit-of-work, and migration contracts", () => {
  const repository: Repository<{ readonly id: string }, string> = {
    findById: async () => undefined,
    save: async (entity) => entity,
    delete: async () => undefined,
  };
  const unitOfWork: UnitOfWork = { execute: async (work) => work(createTransaction([])) };
  const migration: MigrationDescriptor = {
    checksum: "0".repeat(64),
    id: "settings.001",
    owner: "modules/settings",
    description: "Create settings records.",
    apply: async () => undefined,
  };

  assert.equal(repository.save({ id: "one" }) instanceof Promise, true);
  assert.equal(unitOfWork.execute(async () => "done") instanceof Promise, true);
  assert.equal(migration.id, "settings.001");
});

function createTransaction(events: string[]): Transaction {
  return {
    commit: async () => {
      events.push("commit");
    },
    rollback: async () => {
      events.push("rollback");
    },
  };
}
