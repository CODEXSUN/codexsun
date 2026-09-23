import type { FastifyInstance } from "fastify";
import type { ProviderEngine } from "@codexsun/framework";
import { z } from "zod";

const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  providers: z.array(z.string()),
  readiness: z.array(z.object({ id: z.string(), state: z.string() })),
});

export async function registerHealthRoute(app: FastifyInstance, engine: ProviderEngine) {
  app.get("/healthz", { schema: { hide: true } }, async (_request, reply) => {
    const status = engine.isReady() ? "ok" : "degraded";
    return reply.code(status === "ok" ? 200 : 503).send({ status });
  });
  app.get(
    "/api/v1/platform/health",
    {
      schema: {
        tags: ["System"],
        response: { 200: healthResponseSchema, 503: healthResponseSchema },
      },
    },
    async (_request, reply) => {
    const status = engine.isReady() ? "ok" : "degraded";
    return reply.code(status === "ok" ? 200 : 503).send({
      status,
      providers: engine.ids(),
      readiness: engine.readiness(),
    });
    },
  );
}
