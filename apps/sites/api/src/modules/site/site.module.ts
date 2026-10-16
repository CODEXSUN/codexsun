import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSiteRoutes } from "./site.routes.js";
import type { SitesRequestContext } from "./site.types.js";

export const siteModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "sites.site",
  register(
    app: FastifyInstance,
    resolveContext: (request: FastifyRequest) => SitesRequestContext | Promise<SitesRequestContext>
  ) {
    registerSiteRoutes(app, resolveContext);
  }
};
