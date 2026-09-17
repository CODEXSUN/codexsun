import type { Actor } from "@codexsun/platform-core";
import type { ActorReadResult, IdentityService } from "../service/identity.service.js";

export class IdentityController {
  constructor(private readonly service: IdentityService) {}

  getCurrentActor(authenticatedActor: Actor): Actor {
    return authenticatedActor;
  }

  getActor(actorId: string, authenticatedActor: Actor): Promise<ActorReadResult> {
    return this.service.readActor(actorId, authenticatedActor);
  }
}
