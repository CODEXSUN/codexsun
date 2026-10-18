import assert from "node:assert/strict";
import { test } from "node:test";
import type { Kysely } from "kysely";
import type { FrappeDatabase } from "./connection.types.js";
import { FrappeConnectionRepository } from "./connection.repository.js";

test("saving an enquiry link stores a MariaDB DATETIME value", async () => {
  let savedAt: string | undefined;
  const insert = {
    values: () => insert,
    onDuplicateKeyUpdate: (values: { synced_at: string }) => {
      savedAt = values.synced_at;
      return insert;
    },
    execute: async () => undefined
  };
  const database = {
    insertInto: () => insert
  } as unknown as Kysely<FrappeDatabase>;

  await new FrappeConnectionRepository(database).save(42, "ENQ27");

  assert.match(savedAt ?? "", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u);
});
