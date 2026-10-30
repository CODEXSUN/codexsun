import type { FastifyInstance } from "fastify";
import { registerProductImageRoutes } from "./product-image.routes.js";
export const productImageModule = {
  key: "ecommerce.catalog.product-image",
  register(app: FastifyInstance) {
    return registerProductImageRoutes(app);
  }
};
