import type { FastifyInstance } from "fastify";
import type { ResolveTconnectContext } from "../../context.js";
import { registerAssociationRoutes } from "./association.routes.js";
export { registerAssociationRoutes };
export const associationModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.association",
  register: (app: FastifyInstance, resolve: ResolveTconnectContext) =>
    registerAssociationRoutes(app, resolve)
};
