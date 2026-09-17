import type { FastifyInstance } from "fastify";
import type { ProviderEngine } from "@codexsun/framework";
export async function registerHealthRoute(app: FastifyInstance, engine: ProviderEngine) {
  app.get("/healthz", async (_request, reply) => {
    const status = engine.isReady() ? "ok" : "degraded";
    return reply.code(status === "ok" ? 200 : 503).send({ status });
  });
  app.get("/api/v1/platform/health", async (_request, reply) => {
    const status = engine.isReady() ? "ok" : "degraded";
    return reply.code(status === "ok" ? 200 : 503).send({
      status,
      providers: engine.ids(),
      readiness: engine.readiness(),
    });
  });
}
