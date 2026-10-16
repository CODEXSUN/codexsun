import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { DocsOverviewService } from "./overview.service.js";
import type { DocsOverviewRequestContext } from "./overview.types.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("docs"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerDocsOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<DocsOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/docs/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("docs.overview.view");
      return new DocsOverviewService(scope).getOverview();
    }
  });
}
