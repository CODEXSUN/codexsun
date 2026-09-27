import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { LocalIdentityStore, type LocalIdentityConfiguration } from "@codexsun/platform-core";

const databasePath = resolve(process.cwd(), "../../../storage/runtime/codeloop-identity-test.sqlite");

test("installs CodeLoop identity migrations and development seeds in SQLite", async () => {
  mkdirSync(dirname(databasePath), { recursive: true });
  if (existsSync(databasePath)) rmSync(databasePath, { force: true });

  const identity = new LocalIdentityStore(testConfiguration(databasePath));
  await identity.initialize();
  identity.close();

  const database = new DatabaseSync(databasePath);
  const migrations = database.prepare("SELECT id, sequence FROM identity_migration_state ORDER BY sequence").all().map(({ id, sequence }) => ({ id: String(id), sequence: Number(sequence) }));
  const roles = database.prepare("SELECT id FROM identity_roles ORDER BY id").all().map(({ id }) => ({ id: String(id) }));
  const users = database.prepare("SELECT login FROM identity_users ORDER BY login").all().map(({ login }) => ({ login: String(login) }));
  database.close();
  rmSync(databasePath, { force: true });

  assert.deepEqual(migrations, [
    { id: "identity.001", sequence: 0 },
    { id: "identity.002", sequence: 1 },
    { id: "identity.003", sequence: 2 },
    { id: "identity.004", sequence: 3 },
    { id: "identity.005", sequence: 4 },
  ]);
  assert.deepEqual(roles, [{ id: "admin" }, { id: "super-admin" }, { id: "user" }]);
  assert.deepEqual(users, [
    { login: "admin@codeloop.local" },
    { login: "superadmin@codeloop.local" },
    { login: "user@codeloop.local" },
  ]);
});

function testConfiguration(databasePath: string): LocalIdentityConfiguration {
  return {
    applicationId: "codeloop",
    appMode: "development",
    autoLogin: false,
    autoLoginDesk: "user",
    databasePath,
    exposeDevelopmentResetToken: false,
    loginLockoutSeconds: 900,
    loginMaxFailures: 5,
    loginWindowSeconds: 900,
    passwordResetTokenTtlSeconds: 900,
    refreshSeeds: true,
    secret: "codeloop-test-secret-that-is-at-least-32-chars",
    seeds: [
      { login: "superadmin@codeloop.local", name: "CodeLoop Super Admin", password: "change-this-super-admin", role: "super-admin", username: "superadmin" },
      { login: "admin@codeloop.local", name: "CodeLoop Admin", password: "change-this-admin", role: "admin", username: "admin" },
      { login: "user@codeloop.local", name: "CodeLoop User", password: "change-this-user", role: "user", username: "user" },
    ],
  };
}
