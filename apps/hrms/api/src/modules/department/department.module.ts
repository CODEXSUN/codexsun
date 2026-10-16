import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerDepartmentRoutes } from "./department.routes.js";
import type { DepartmentContext } from "./department.types.js";

export const departmentModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "hrms.department",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<DepartmentContext>
  ) => registerDepartmentRoutes(app, context)
};
