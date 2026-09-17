import type { Kysely } from "kysely";
import type { IdentityDatabase } from "../identity.database.js";

export const identityMigration = {
  id: "identity.001",
  owner: "platform.identity",
  description: "Create identity actors, roles, and explicit permissions.",
  async apply(database: Kysely<IdentityDatabase>): Promise<void> {
    await database.schema
      .createTable("identity_actors")
      .addColumn("id", "varchar(120)", (column) => column.primaryKey())
      .addColumn("kind", "varchar(20)", (column) => column.notNull())
      .execute();
    await database.schema
      .createTable("identity_roles")
      .addColumn("id", "varchar(120)", (column) => column.primaryKey())
      .addColumn("permissions", "text", (column) => column.notNull())
      .execute();
    await database.schema
      .createTable("identity_actor_roles")
      .addColumn("actor_id", "varchar(120)", (column) => column.notNull())
      .addColumn("role_id", "varchar(120)", (column) => column.notNull())
      .addPrimaryKeyConstraint("identity_actor_roles_primary", ["actor_id", "role_id"])
      .execute();
    await database.schema
      .createTable("identity_actor_permissions")
      .addColumn("actor_id", "varchar(120)", (column) => column.notNull())
      .addColumn("permission", "varchar(120)", (column) => column.notNull())
      .addPrimaryKeyConstraint("identity_actor_permissions_primary", ["actor_id", "permission"])
      .execute();
  },
  async revert(database: Kysely<IdentityDatabase>): Promise<void> {
    await database.schema.dropTable("identity_actor_permissions").execute();
    await database.schema.dropTable("identity_actor_roles").execute();
    await database.schema.dropTable("identity_roles").execute();
    await database.schema.dropTable("identity_actors").execute();
  },
};
