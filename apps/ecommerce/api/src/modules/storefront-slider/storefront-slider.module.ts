import type { FastifyInstance } from "fastify";
import { registerStorefrontSliderRoutes } from "./storefront-slider.routes.js";

export const storefrontSliderModule = {
  key: "ecommerce.storefront.slider",
  register(app: FastifyInstance) {
    return registerStorefrontSliderRoutes(app);
  }
};
