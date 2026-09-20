import assert from "node:assert/strict";
import test from "node:test";
import { readQcafePersistenceConfiguration } from "../persistence/qcafe-persistence-configuration.js";
import { createQcafePersistence, prepareQcafePersistence } from "../persistence/qcafe-persistence.js";

test("uses SQLite and runs Q Cafe foundation migrations for a local outlet", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" });
  await assert.rejects(persistence.verify(), /explicit migration command/u);
  assert.deepEqual(await persistence.initialize(), ["qcafe.foundation.001", "qcafe.foundation.002", "qcafe.foundation.003"]);
  assert.deepEqual(await persistence.initialize(), []);
  const records = await persistence.verify();
  assert.deepEqual(
    records.map((record) => record.descriptorId),
    ["qcafe.foundation.001", "qcafe.foundation.002", "qcafe.foundation.003", "qcafe.foundation.seed.001"],
  );
  assert.equal(records.find((record) => record.kind === "seeder")?.runCount, 2);
  await persistence.destroy();
});

test("production startup verifies lifecycle state without migrating", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" });
  await assert.rejects(prepareQcafePersistence(persistence, "production"), /explicit migration command/u);
  await persistence.initialize();
  await prepareQcafePersistence(persistence, "production");
  await persistence.destroy();
});

test("selects SQLite or the shared MariaDB connection from DB_DRIVER", () => {
  assert.deepEqual(readQcafePersistenceConfiguration({ DB_DRIVER: "sqlite" }, "local.sqlite"), {
    localDatabasePath: "local.sqlite",
    mode: "local",
  });
  assert.throws(() => readQcafePersistenceConfiguration({ DB_DRIVER: "mariadb" }, "local.sqlite"), /DB_HOST/u);
  assert.deepEqual(
    readQcafePersistenceConfiguration(
      {
        DB_DRIVER: "mariadb",
        DB_HOST: "127.0.0.1",
        DB_MASTER_NAME: "qcafe_db",
        DB_PASSWORD: "secret",
        DB_PORT: "3306",
        DB_USER: "root",
      },
      "local.sqlite",
    ),
    {
      cloudDatabaseUrl: "mysql://root:secret@127.0.0.1:3306/qcafe_db",
      localDatabasePath: "local.sqlite",
      mode: "cloud",
    },
  );
});
