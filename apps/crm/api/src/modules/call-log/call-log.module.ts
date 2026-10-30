import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerCallLogRoutes } from "./call-log.routes.js";
import type { CallLogContext } from "./call-log.types.js";

export const callLogModule = {
  key: "crm.call-log",
  register: (app: FastifyInstance, context: (request: FastifyRequest) => Promise<CallLogContext>) =>
    registerCallLogRoutes(app, context)
};
