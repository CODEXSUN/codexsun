import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerEcommerceOverviewRoutes } from "./overview.routes.js";
import type { EcommerceOverviewRequestContext } from "./overview.types.js";

export const ecommerceOverviewModule = {
  key: "ecommerce.overview",
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<EcommerceOverviewRequestContext>
  ) => registerEcommerceOverviewRoutes(app, context)
};
