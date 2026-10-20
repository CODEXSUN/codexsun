import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerSchedulerRoutes } from "./scheduler.routes.js";
import type { SchedulerContext } from "./scheduler.types.js";

export const schedulerModule = {
  key: "crm.scheduler",
  capabilities: { events: false, worker: false, sync: false },
  register(app: FastifyInstance, context: (request: FastifyRequest) => Promise<SchedulerContext>) {
    registerSchedulerRoutes(app, context);
  }
};
