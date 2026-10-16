import type { FastifyInstance } from "fastify";
import { registerCatalogMatchingRoutes } from "./catalog-matching.routes.js";
export const catalogMatchingModule = {
  key: "ecommerce.catalog.matching",
  register(app: FastifyInstance) {
    return registerCatalogMatchingRoutes(app);
  }
};
