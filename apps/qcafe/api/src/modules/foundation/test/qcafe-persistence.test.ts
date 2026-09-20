import assert from "node:assert/strict";
import test from "node:test";
import { readQcafePersistenceConfiguration } from "../persistence/qcafe-persistence-configuration.js";
import { createQcafePersistence } from "../persistence/qcafe-persistence.js";

test("uses SQLite and runs Q Cafe foundation migrations for a local outlet", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" });
  assert.deepEqual(await persistence.initialize(), ["qcafe.foundation.001"]);
  assert.deepEqual(await persistence.initialize(), []);
  await persistence.destroy();
});

test("requires a MariaDB URL for cloud mode", () => {
  assert.throws(
    () => readQcafePersistenceConfiguration({ QCAFE_DATA_MODE: "cloud" }, "local.sqlite"),
    /QCAFE_CLOUD_DATABASE_URL/u,
  );
  assert.deepEqual(
    readQcafePersistenceConfiguration(
      { QCAFE_CLOUD_DATABASE_URL: "mysql://user:password@database.example/qcafe", QCAFE_DATA_MODE: "cloud" },
      "local.sqlite",
    ),
    {
      cloudDatabaseUrl: "mysql://user:password@database.example/qcafe",
      localDatabasePath: "local.sqlite",
      mode: "cloud",
    },
  );
});
