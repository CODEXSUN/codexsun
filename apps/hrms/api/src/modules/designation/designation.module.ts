import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerDesignationRoutes } from "./designation.routes.js";
import type { DesignationContext } from "./designation.types.js";

export const designationModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "hrms.designation",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<DesignationContext>
  ) => registerDesignationRoutes(app, context)
};
