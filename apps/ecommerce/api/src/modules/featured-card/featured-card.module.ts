import type { FastifyInstance } from "fastify";
import { registerFeaturedCardRoutes } from "./featured-card.routes.js";

export const featuredCardModule = {
  key: "ecommerce.storefront.featured-card",
  register(app: FastifyInstance) {
    return registerFeaturedCardRoutes(app);
  }
};
