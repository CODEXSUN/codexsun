import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerCrmContactRoutes } from "./contact.routes.js";

export const crmContactModule = {
  key: "crm.contact",
  capabilities: ["core-contact-proxy"],
  register(app: FastifyInstance, authorize: (request: FastifyRequest) => Promise<void>) {
    return registerCrmContactRoutes(app, authorize);
  }
};
