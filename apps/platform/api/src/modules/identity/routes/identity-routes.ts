import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { JwtIdentityAuthenticator } from "../auth/jwt-identity-authenticator.js";
import type { IdentityController } from "../controller/identity.controller.js";

const actorParamsSchema = z.object({ actorId: z.string().trim().min(1).max(120) });

export async function registerIdentityRoutes(
  app: FastifyInstance,
  controller: IdentityController,
  authenticator: JwtIdentityAuthenticator,
): Promise<void> {
  app.get("/api/v1/identity/actors/me", async (request, reply) => {
    const authenticatedActor = await authenticator.authenticate(request.headers.authorization);
    if (!authenticatedActor) return reply.code(401).send({ error: "Authentication required." });
    return controller.getCurrentActor(authenticatedActor);
  });

  app.get("/api/v1/identity/actors/:actorId", async (request, reply) => {
    const parsed = actorParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid actor ID." });

    const authenticatedActor = await authenticator.authenticate(request.headers.authorization);
    if (!authenticatedActor) return reply.code(401).send({ error: "Authentication required." });

    const result = await controller.getActor(parsed.data.actorId, authenticatedActor);
    if (result.state === "not-found") return reply.code(404).send({ error: "Actor not found." });
    if (result.state === "forbidden") return reply.code(403).send({ error: "Access denied." });
    return result.actor;
  });
}
