import type { FastifyInstance } from "fastify";
import type { ProviderEngine } from "@codexsun/framework";
export async function registerHealthRoute(app: FastifyInstance, engine: ProviderEngine) {
  app.get("/api/v1/platform/health", async () => ({
    status: engine.isReady() ? "ok" : "degraded",
    providers: engine.ids(),
    readiness: engine.readiness(),
  }));
}
