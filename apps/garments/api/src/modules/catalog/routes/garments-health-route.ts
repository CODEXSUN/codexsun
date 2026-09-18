import { garmentsApiVersion, garmentsHealthResponseSchema } from "@codexsun/garments-contracts";
import type { ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";

export async function registerGarmentsHealthRoute(app: FastifyInstance, engine: ProviderEngine): Promise<void> {
  app.get("/api/garments/v1/health", async () =>
    garmentsHealthResponseSchema.parse({
      data: { status: engine.isReady() ? "ok" : "degraded", service: "garments", providers: engine.ids() },
      version: garmentsApiVersion,
    }),
  );
}
