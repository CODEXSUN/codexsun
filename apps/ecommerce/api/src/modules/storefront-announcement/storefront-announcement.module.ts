import type { FastifyInstance } from "fastify";
import { registerStorefrontAnnouncementRoutes } from "./storefront-announcement.routes.js";

export const storefrontAnnouncementModule = {
  key: "ecommerce.storefront.announcement",
  register(app: FastifyInstance) {
    return registerStorefrontAnnouncementRoutes(app);
  }
};
