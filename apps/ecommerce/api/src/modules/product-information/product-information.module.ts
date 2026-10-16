import type { FastifyInstance } from "fastify";
import { registerProductInformationRoutes } from "./product-information.routes.js";
export const productInformationModule = {
  key: "ecommerce.catalog.product-information",
  register(app: FastifyInstance) {
    return registerProductInformationRoutes(app);
  }
};
