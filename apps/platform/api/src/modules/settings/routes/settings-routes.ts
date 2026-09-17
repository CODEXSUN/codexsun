import type { Actor } from "@codexsun/platform-core";
import type { FastifyInstance } from "fastify";
import type { SettingsController } from "../controller/settings.controller.js";

export type SettingsAuthenticator = (authorization: string | undefined) => Promise<Actor | undefined>;

export async function registerSettingsRoutes(
  app: FastifyInstance,
  controller: SettingsController,
  authenticate: SettingsAuthenticator,
): Promise<void> {
  app.get("/api/v1/platform/settings", async (request, reply) => {
    const actor = await authenticate(request.headers.authorization);
    if (!actor) return reply.code(401).send({ error: "Authentication required." });

    const result = await controller.getSettings(actor);
    if (result.state === "forbidden") return reply.code(403).send({ error: "Access denied." });
    return { settings: result.settings };
  });
}
