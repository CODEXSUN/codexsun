import assert from "node:assert/strict";
import test from "node:test";
import { createSqliteDataProvider } from "@codexsun/platform-core";
import type { IdentityDatabase } from "../identity.database.js";
import { identityMigration } from "../migrations/identity.migration.js";
import { KyselyIdentityRepository } from "../repository/identity.repository.js";
import { identitySeeder } from "../seeders/identity.seeder.js";

test("migrates, seeds, and reads module-owned identity data", async () => {
  const provider = createSqliteDataProvider<IdentityDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await identityMigration.apply(database);
  await identitySeeder.seed(database);
  await identitySeeder.seed(database);
  await database.insertInto("identity_actors").values({ id: "user-1", kind: "user" }).execute();
  await database
    .insertInto("identity_actor_roles")
    .values({ actor_id: "user-1", role_id: "platform.operator" })
    .execute();
  await database
    .insertInto("identity_actor_permissions")
    .values({ actor_id: "user-1", permission: "identity.read" })
    .execute();

  const repository = new KyselyIdentityRepository(database);
  const actor = await repository.findActorById("user-1");
  const roles = await database.selectFrom("identity_roles").selectAll().execute();

  assert.deepEqual(actor, {
    id: "user-1",
    kind: "user",
    roles: ["platform.operator"],
    permissions: ["identity.read"],
  });
  assert.equal(roles.length, 2);
  await provider.destroy();
});
