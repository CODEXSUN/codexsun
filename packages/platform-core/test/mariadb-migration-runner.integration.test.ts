import assert from "node:assert/strict";
import test from "node:test";
import { MigrationRunner, createMariaDbDataProvider } from "../src/index.js";

const connectionUrl = process.env.PLATFORM_MARIADB_INTEGRATION_URL;

test("runs a migration against an explicitly configured MariaDB test database", { skip: !connectionUrl }, async () => {
  const url = new URL(connectionUrl!);
  assert.match(url.pathname, /test/i);
  const provider = createMariaDbDataProvider<{ migration_runner_integration: { id: string } }>({
    connectionUrl: connectionUrl!,
  });
  const runner = new MigrationRunner(provider.queryDatabase());

  const applied = await runner.run({
    moduleId: "platform.integration",
    migrations: [
      {
        id: "platform.integration.001",
        owner: "platform.integration",
        async apply(database) {
          await database.schema
            .createTable("migration_runner_integration")
            .ifNotExists()
            .addColumn("id", "varchar(120)", (column) => column.primaryKey())
            .execute();
        },
      },
    ],
    seeders: [],
  });
  assert.deepEqual(applied, ["platform.integration.001"]);
  await provider.destroy();
});
