import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { IdentityDatabase } from "../identity.database.js";

const defaultRoles = [
  { id: "platform.operator", permissions: JSON.stringify(["platform.health.read"]) },
  { id: "platform.administrator", permissions: JSON.stringify(["platform.health.read", "identity.read"]) },
];

const defaultActors = [
  {
    id: "platform.operator",
    kind: "service" as const,
    roleId: "platform.operator",
    permission: "platform.health.read",
  },
  {
    id: "platform.administrator",
    kind: "user" as const,
    roleId: "platform.administrator",
    permission: "identity.read",
  },
];

export const identitySeeder = {
  checksum: createLifecycleChecksum(
    "identity.seed.001|platform.operator,platform.administrator|roles actors role assignments and permissions",
  ),
  id: "identity.seed.001",
  owner: "platform.identity",
  description: "Seed platform identity roles without credentials.",
  async seed(database: Kysely<IdentityDatabase>): Promise<void> {
    for (const role of defaultRoles) {
      const existing = await database
        .selectFrom("identity_roles")
        .select("id")
        .where("id", "=", role.id)
        .executeTakeFirst();
      if (!existing) await database.insertInto("identity_roles").values(role).execute();
    }
    for (const actor of defaultActors) {
      const existing = await database
        .selectFrom("identity_actors")
        .select("id")
        .where("id", "=", actor.id)
        .executeTakeFirst();
      if (!existing) await database.insertInto("identity_actors").values({ id: actor.id, kind: actor.kind }).execute();
      const role = await database
        .selectFrom("identity_actor_roles")
        .select("actor_id")
        .where("actor_id", "=", actor.id)
        .where("role_id", "=", actor.roleId)
        .executeTakeFirst();
      if (!role)
        await database
          .insertInto("identity_actor_roles")
          .values({ actor_id: actor.id, role_id: actor.roleId })
          .execute();
      const permission = await database
        .selectFrom("identity_actor_permissions")
        .select("actor_id")
        .where("actor_id", "=", actor.id)
        .where("permission", "=", actor.permission)
        .executeTakeFirst();
      if (!permission)
        await database
          .insertInto("identity_actor_permissions")
          .values({ actor_id: actor.id, permission: actor.permission })
          .execute();
    }
  },
};
