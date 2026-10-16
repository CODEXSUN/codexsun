import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSopItemRoutes } from "./sop-item.routes.js";
import type { SopItemRequestContext } from "./sop-item.types.js";

export const sopItemModule = {
  key: "crm.sop-item",
  register: (app: FastifyInstance, context: (request: FastifyRequest) => Promise<SopItemRequestContext>) =>
    registerSopItemRoutes(app, context)
};
