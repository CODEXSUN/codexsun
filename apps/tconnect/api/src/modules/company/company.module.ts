import type { FastifyInstance } from "fastify";
import type { ResolveTconnectContext } from "../../context.js";
import { registerCompanyRoutes } from "./company.routes.js";
export { registerCompanyRoutes };
export const companyModule = {
  capabilities: { events: false, worker: false, sync: false },
  key: "tconnect.company",
  register: (app: FastifyInstance, resolve: ResolveTconnectContext) =>
    registerCompanyRoutes(app, resolve)
};
