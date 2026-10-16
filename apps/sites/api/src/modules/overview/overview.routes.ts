import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { SitesOverviewService } from "./overview.service.js";
import type { SitesOverviewRequestContext } from "./overview.types.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("sites"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerSitesOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<SitesOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("sites.overview.view");
      return new SitesOverviewService(scope).getOverview();
    }
  });
}
