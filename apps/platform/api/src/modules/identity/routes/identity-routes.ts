import type { FastifyInstance } from "fastify";
import { apiError, apiErrorSchema } from "@codexsun/contracts";
import { actorSchema } from "@codexsun/platform-core";
import { z } from "zod";
import type { JwtIdentityAuthenticator } from "../auth/jwt-identity-authenticator.js";
import type { IdentityController } from "../controller/identity.controller.js";

const actorParamsSchema = z.object({ actorId: z.string().trim().min(1).max(120) });

export async function registerIdentityRoutes(
  app: FastifyInstance,
  controller: IdentityController,
  authenticator: JwtIdentityAuthenticator,
): Promise<void> {
  app.get(
    "/api/v1/identity/actors/me",
    { schema: { tags: ["Identity"], response: { 200: actorSchema, 401: apiErrorSchema } } },
    async (request, reply) => {
    const authenticatedActor = await authenticator.authenticate(request.headers.authorization);
    if (!authenticatedActor)
      return reply.code(401).send(apiError("Authentication required.", "identity.authentication-required"));
    return controller.getCurrentActor(authenticatedActor);
    },
  );

  app.get(
    "/api/v1/identity/actors/:actorId",
    {
      schema: {
        tags: ["Identity"],
        params: actorParamsSchema,
        response: { 200: actorSchema, 400: apiErrorSchema, 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema },
      },
    },
    async (request, reply) => {
    const parsed = actorParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send(apiError("Invalid actor ID.", "identity.invalid-actor-id"));

    const authenticatedActor = await authenticator.authenticate(request.headers.authorization);
    if (!authenticatedActor)
      return reply.code(401).send(apiError("Authentication required.", "identity.authentication-required"));

    const result = await controller.getActor(parsed.data.actorId, authenticatedActor);
    if (result.state === "not-found")
      return reply.code(404).send(apiError("Actor not found.", "identity.actor-not-found"));
    if (result.state === "forbidden") return reply.code(403).send(apiError("Access denied.", "identity.access-denied"));
    return result.actor;
    },
  );
}
