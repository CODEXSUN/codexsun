import type { Kysely } from "kysely";
import type { IdentityDatabase } from "../identity.database.js";

const defaultRoles = [
  { id: "platform.operator", permissions: JSON.stringify(["platform.health.read"]) },
  { id: "platform.administrator", permissions: JSON.stringify(["platform.health.read", "identity.read"]) },
];

export const identitySeeder = {
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
  },
};
