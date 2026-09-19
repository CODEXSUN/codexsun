import assert from "node:assert/strict";
import test from "node:test";
import { MigrationRunner, createMariaDbDataProvider } from "@codexsun/platform-core";

const connectionUrl = process.env.CRM_MARIADB_INTEGRATION_URL;

test("runs crm migrations against an explicit MariaDB test database", { skip: !connectionUrl }, async () => {
  assert.match(new URL(connectionUrl!).pathname, /test/i);
  const provider = createMariaDbDataProvider({ connectionUrl: connectionUrl! });
  try {
    const runner = new MigrationRunner(provider.queryDatabase());
    await runner.run({ moduleId: "crm.integration", migrations: [], seeders: [] });
  } finally {
    await provider.destroy();
  }
});
