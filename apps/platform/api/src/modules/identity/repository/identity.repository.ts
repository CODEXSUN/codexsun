import type { Actor } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { IdentityDatabase } from "../identity.database.js";

export interface IdentityRepository {
  findActorById(id: string): Promise<Actor | undefined>;
}

export class InMemoryIdentityRepository implements IdentityRepository {
  constructor(private readonly actors: readonly Actor[]) {}

  async findActorById(id: string): Promise<Actor | undefined> {
    return this.actors.find((actor) => actor.id === id);
  }
}

export class KyselyIdentityRepository implements IdentityRepository {
  constructor(private readonly database: Kysely<IdentityDatabase>) {}

  async findActorById(id: string): Promise<Actor | undefined> {
    const actor = await this.database.selectFrom("identity_actors").selectAll().where("id", "=", id).executeTakeFirst();
    if (!actor) return undefined;

    const [roles, permissions] = await Promise.all([
      this.database.selectFrom("identity_actor_roles").select("role_id").where("actor_id", "=", id).execute(),
      this.database.selectFrom("identity_actor_permissions").select("permission").where("actor_id", "=", id).execute(),
    ]);

    return {
      id: actor.id,
      kind: actor.kind,
      roles: roles.map((role) => role.role_id),
      permissions: permissions.map((permission) => permission.permission),
    };
  }
}
