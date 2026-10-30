import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerHrmsOverviewRoutes } from "./overview.routes.js";
import type { HrmsOverviewRequestContext } from "./overview.types.js";

export const hrmsOverviewModule = {
  key: "hrms.overview",
  // Read-only tenant desk: no owned business tables, CRUD lifecycle, events or workers.
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<HrmsOverviewRequestContext>
  ) => registerHrmsOverviewRoutes(app, context)
};
