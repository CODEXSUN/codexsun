import { docsApiVersion, docsHealthResponseSchema } from "@codexsun/docs-contracts";
import type { ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";

export async function registerDocsHealthRoute(app: FastifyInstance, engine: ProviderEngine): Promise<void> {
  app.get("/api/docs/v1/health", async () =>
    docsHealthResponseSchema.parse({
      data: {
        status: engine.isReady() ? "ok" : "degraded",
        service: "docs",
        providers: engine.ids(),
      },
      version: docsApiVersion,
    }),
  );
}
