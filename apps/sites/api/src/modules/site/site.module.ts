import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSiteRoutes } from "./site.routes.js";
import type { DeploymentHost } from "./deployment/index.js";
import type { SitesRequestContext } from "./site.types.js";

export const siteModule = {
  // The registry is synchronous. Its deployment leaf owns queued delivery jobs.
  capabilities: { events: false, worker: false, sync: false },
  key: "sites.site",
  register(
    app: FastifyInstance,
    resolveContext: (request: FastifyRequest) => SitesRequestContext | Promise<SitesRequestContext>,
    deploymentHost?: DeploymentHost
  ) {
    registerSiteRoutes(app, resolveContext, deploymentHost);
  }
};
