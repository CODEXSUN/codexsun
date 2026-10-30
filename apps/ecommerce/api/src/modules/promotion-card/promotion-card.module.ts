import type { FastifyInstance } from "fastify";
import { registerPromotionCardRoutes } from "./promotion-card.routes.js";

export const promotionCardModule = {
  key: "ecommerce.storefront.promotion",
  register(app: FastifyInstance) {
    return registerPromotionCardRoutes(app);
  }
};
