import { authorize, type Actor } from "@codexsun/platform-core";
import type { IdentityRepository } from "../repository/identity.repository.js";

export type ActorReadResult =
  | { readonly state: "found"; readonly actor: Actor }
  | { readonly state: "forbidden" }
  | { readonly state: "not-found" };

export class IdentityService {
  constructor(private readonly repository: IdentityRepository) {}

  findActor(actorId: string): Promise<Actor | undefined> {
    return this.repository.findActorById(actorId);
  }

  async readActor(requestedActorId: string, authenticatedActor: Actor): Promise<ActorReadResult> {
    const actor = await this.findActor(requestedActorId);
    if (!actor) return { state: "not-found" };
    if (actor.id === authenticatedActor.id) return { state: "found", actor };

    return authorize(authenticatedActor, { permissions: ["identity.read"] }).allowed
      ? { state: "found", actor }
      : { state: "forbidden" };
  }
}
