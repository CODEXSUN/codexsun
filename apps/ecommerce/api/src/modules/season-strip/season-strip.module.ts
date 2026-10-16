import type { FastifyInstance } from "fastify";
import { registerSeasonStripRoutes } from "./season-strip.routes.js";
export const seasonStripModule = {
  key: "ecommerce.storefront.season-strip",
  register(app: FastifyInstance) {
    return registerSeasonStripRoutes(app);
  }
};
