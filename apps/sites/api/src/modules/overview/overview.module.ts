import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSitesOverviewRoutes } from "./overview.routes.js";
import type { SitesOverviewRequestContext } from "./overview.types.js";

export const sitesOverviewModule = {
  key: "sites.overview",
  // Read-only tenant desk: no owned business tables, CRUD lifecycle, events or workers.
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<SitesOverviewRequestContext>
  ) => registerSitesOverviewRoutes(app, context)
};
