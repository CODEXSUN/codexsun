import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerEmployeeRoutes } from "./employee.routes.js";
import type { EmployeeContext } from "./employee.types.js";

export const employeeModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "hrms.employee",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<EmployeeContext>
  ) => registerEmployeeRoutes(app, context)
};
