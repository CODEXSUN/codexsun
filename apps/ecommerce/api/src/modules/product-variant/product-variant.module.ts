import type { FastifyInstance } from "fastify";
import { registerProductVariantRoutes } from "./product-variant.routes.js";
export const productVariantModule = {
  key: "ecommerce.catalog.product-variant",
  register(app: FastifyInstance) {
    return registerProductVariantRoutes(app);
  }
};
