import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { LogicxErpOverviewService } from "./overview.service.js";
import type { LogicxErpOverviewRequestContext } from "./overview.types.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("logicx-erp"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerLogicxErpOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<LogicxErpOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("logicx-erp.overview.view");
      return new LogicxErpOverviewService(scope).getOverview();
    }
  });
}
