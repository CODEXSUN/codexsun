import { zetroApiVersion, zetroHealthResponseSchema, type ZetroSqliteReadiness } from "@codexsun/zetro-contracts";
import type { ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";

export async function registerZetroHealthRoute(app: FastifyInstance, engine: ProviderEngine): Promise<void> {
  app.get("/api/zetro/v1/health", async () => {
    const database = await engine.require<ZetroSqliteReadiness>("zetro.sqlite").check();
    return zetroHealthResponseSchema.parse({
      data: {
        status: engine.isReady() && database ? "ok" : "degraded",
        service: "zetro",
        providers: engine.ids(),
        database: database ? "ok" : "unavailable",
      },
      version: zetroApiVersion,
    });
  });
}
