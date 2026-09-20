import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyQcafeSqlite } from "../persistence/qcafe-database-verifier.js";

test("smoke verifies the assigned SQLite database", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcafe-database-smoke-"));
  try {
    const result = await verifyQcafeSqlite(join(directory, "qcafe.sqlite"));
    assert.equal(result.driver, "sqlite");
    assert.equal(result.lifecycleRecords, 4);
    assert.deepEqual(result.migrations, ["qcafe.foundation.001", "qcafe.foundation.002", "qcafe.foundation.003"]);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
