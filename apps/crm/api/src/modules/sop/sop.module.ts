import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSopRoutes, type SopRequestContext } from "./sop.routes.js";

export const sopModule = {
  key: "crm.sop",
  register: (app: FastifyInstance, context: (request: FastifyRequest) => Promise<SopRequestContext>) =>
    registerSopRoutes(app, context)
};
