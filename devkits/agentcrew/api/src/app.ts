import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";
import type { Configuration } from "./config.js";
import type { AssistantService } from "./modules/assistant/service.js";
import { registerAssistantRoutes } from "./modules/assistant/routes.js";

export function createApp(config: Configuration, service: AssistantService) {
  const app = Fastify({ bodyLimit: 40000, logger: false });
  app.addHook("onRequest", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    if (request.url === "/health") return;
    const supplied = Buffer.from(request.headers.authorization ?? "");
    const expected = Buffer.from(`Bearer ${config.AGENTCREW_TOKEN}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
      return reply.code(401).send({ error: "Connect with your local access token." });
  });
  app.get("/health", async () => ({ healthy: true }));
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError)
      return reply
        .code(400)
        .send({ error: "Invalid input.", fields: error.issues.map((issue) => issue.path.join(".")) });
    return reply.code(503).send({ error: "Request unavailable. Check the service status and retry." });
  });
  registerAssistantRoutes(app, service);
  return app;
}
