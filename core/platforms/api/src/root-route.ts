import type { ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";

export function registerRootRoute(app: FastifyInstance, engine: ProviderEngine, frontendOrigin: string): void {
  app.get("/", async (_request, reply) => {
    if (!engine.isReady()) return reply.code(503).send({ status: "degraded" });
    return reply.redirect(frontendOrigin);
  });
}
