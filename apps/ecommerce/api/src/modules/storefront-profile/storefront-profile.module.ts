import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerStorefrontProfileRoutes } from "./storefront-profile.routes.js";

export const storefrontProfileModule = {
  key: "ecommerce.storefront.profile",
  register(app: FastifyInstance, resolveActorEmail: (request: FastifyRequest) => string) {
    return registerStorefrontProfileRoutes(app, resolveActorEmail);
  }
};
export const storefrontProfileModuleKey = storefrontProfileModule.key;
