import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerDutyAssignmentRoutes } from "./duty-assignment.routes.js";
import type { DutyAssignmentContext } from "./duty-assignment.types.js";
export const dutyAssignmentModule = { key: "crm.duty-assignment", register: (app: FastifyInstance, context: (request: FastifyRequest) => Promise<DutyAssignmentContext>) => registerDutyAssignmentRoutes(app, context) };
