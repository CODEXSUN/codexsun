import assert from "node:assert/strict";
import test from "node:test";
import { registerCoreTenantDatabaseConnection } from "@codexsun/core-api";
import { registerBillingTenantDatabaseConnection } from "@codexsun/billing-api";
import { registerAccountsTenantDatabaseConnection } from "@codexsun/accounts-api";

test("app pools reject a different server or credential for the same database name", () => {
  const connection = {
    database: "codexsun_connection_unit_fixture",
    host: "127.0.0.1",
    port: 20001,
    user: "fixture",
    password: "fixture"
  };
  for (const register of [
    registerCoreTenantDatabaseConnection,
    registerBillingTenantDatabaseConnection,
    registerAccountsTenantDatabaseConnection
  ]) {
    register(connection);
    register({ ...connection });
    assert.throws(() => register({ ...connection, port: 20002 }), /Conflicting/);
    assert.throws(() => register({ ...connection, password: "different" }), /Conflicting/);
  }
});
