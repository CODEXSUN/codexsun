import assert from "node:assert/strict";
import test from "node:test";
import { createMariaDbDataProvider } from "../src/index.js";

interface TestDatabase {
  records: { readonly id: string };
}

test("creates a MariaDB Kysely provider without opening a connection", async () => {
  const provider = createMariaDbDataProvider<TestDatabase>({
    connectionUrl: "mysql://local-user:local-password@127.0.0.1:3306/codexsun_test",
  });

  assert.ok(provider.queryDatabase());
  await provider.destroy();
});

test("rejects invalid MariaDB connection URLs", () => {
  assert.throws(() => createMariaDbDataProvider<TestDatabase>({ connectionUrl: "" }), /requires a connection URL/u);
  assert.throws(
    () => createMariaDbDataProvider<TestDatabase>({ connectionUrl: "sqlite://local" }),
    /requires a mysql/u,
  );
  assert.throws(
    () => createMariaDbDataProvider<TestDatabase>({ connectionUrl: "mysql://127.0.0.1" }),
    /requires a database name/u,
  );
});
