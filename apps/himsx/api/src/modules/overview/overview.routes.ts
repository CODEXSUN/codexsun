import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { HimsxOverviewService } from "./overview.service.js";
import type { HimsxOverviewRequestContext } from "./overview.types.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("himsx"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerHimsxOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<HimsxOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/himsx/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("himsx.overview.view");
      return new HimsxOverviewService(scope).getOverview();
    }
  });
}
