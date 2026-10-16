import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerLogicxErpOverviewRoutes } from "./overview.routes.js";
import type { LogicxErpOverviewRequestContext } from "./overview.types.js";

export const logicxErpOverviewModule = {
  key: "logicx-erp.overview",
  // The host supplies the authenticated tenant user and the live tenant identity.
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<LogicxErpOverviewRequestContext>
  ) => registerLogicxErpOverviewRoutes(app, context)
};
