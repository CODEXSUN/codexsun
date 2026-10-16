import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerHimsxOverviewRoutes } from "./overview.routes.js";
import type { HimsxOverviewRequestContext } from "./overview.types.js";

export const himsxOverviewModule = {
  key: "himsx.overview",
  // Read-only tenant desk: no owned business tables, CRUD lifecycle, events or workers.
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<HimsxOverviewRequestContext>
  ) => registerHimsxOverviewRoutes(app, context)
};
