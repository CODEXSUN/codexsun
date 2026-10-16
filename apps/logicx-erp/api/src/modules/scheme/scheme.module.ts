import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerLogicxErpSchemeRoutes } from "./scheme.routes.js";
import type { LogicxErpSchemeRequestContext } from "./scheme.types.js";

export const logicxErpSchemeModule = {
  key: "logicx-erp.scheme",
  // The host supplies the tenant database and the authenticated desk user.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<LogicxErpSchemeRequestContext>
  ) => registerLogicxErpSchemeRoutes(app, context)
};
