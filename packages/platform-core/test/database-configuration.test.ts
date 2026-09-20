import assert from "node:assert/strict";
import test from "node:test";
import { buildMariaDbConnectionUrl, readDatabaseConnectionUrl } from "../src/database-configuration.js";

test("builds an encoded MariaDB URL from shared DB settings", () => {
  assert.equal(
    buildMariaDbConnectionUrl({
      driver: "mariadb",
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "p@ss word",
      masterName: "codexsun_master_db",
    }),
    "mysql://root:p%40ss%20word@127.0.0.1:3306/codexsun_master_db",
  );
});

test("resolves DB_* values when DATABASE_URL is absent", () => {
  assert.equal(
    readDatabaseConnectionUrl({
      DB_DRIVER: "mariadb",
      DB_HOST: "127.0.0.1",
      DB_PORT: "3306",
      DB_USER: "root",
      DB_PASSWORD: "secret",
      DB_MASTER_NAME: "codexsun_master_db",
    }),
    "mysql://root:secret@127.0.0.1:3306/codexsun_master_db",
  );
});

test("keeps explicit DATABASE_URL precedence and validates MariaDB settings", () => {
  assert.equal(readDatabaseConnectionUrl({ DATABASE_URL: "sqlite://local", DB_DRIVER: "mariadb" }), "sqlite://local");
  assert.equal(readDatabaseConnectionUrl({}), "sqlite://local");
  assert.equal(readDatabaseConnectionUrl({ DB_DRIVER: "sqlite" }), "sqlite://local");
  assert.throws(() => readDatabaseConnectionUrl({ DB_DRIVER: "postgres" }), /DB_DRIVER must be sqlite or mariadb/u);
  assert.throws(() => readDatabaseConnectionUrl({ DB_DRIVER: "mariadb", DB_HOST: "127.0.0.1" }), /DB_PORT/u);
});
