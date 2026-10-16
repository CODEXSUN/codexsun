import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { HrmsOverviewService } from "./overview.service.js";
import type { HrmsOverviewRequestContext } from "./overview.types.js";
import { attendanceOverviewSchema } from "../attendance/attendance.routes.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("hrms"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string(),
  attendance: attendanceOverviewSchema
});

export function registerHrmsOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<HrmsOverviewRequestContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("hrms.overview.view");
      return new HrmsOverviewService(scope).getOverview();
    }
  });
}
