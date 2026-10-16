import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { EcommerceOverviewService } from "./overview.service.js";
import type { EcommerceOverviewRequestContext } from "./overview.types.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("ecommerce"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerEcommerceOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<EcommerceOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("ecommerce.overview.view");
      return new EcommerceOverviewService(scope).getOverview();
    }
  });
}
