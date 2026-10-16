import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerDocsOverviewRoutes } from "./overview.routes.js";
import type { DocsOverviewRequestContext } from "./overview.types.js";

export const docsOverviewModule = {
  key: "docs.overview",
  // Read-only tenant desk: no owned business tables, CRUD lifecycle, events or workers.
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<DocsOverviewRequestContext>
  ) => registerDocsOverviewRoutes(app, context)
};
