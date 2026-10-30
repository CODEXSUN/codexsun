import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerTaskRoutes } from "./task.routes.js";
import type { TaskContext } from "./task.types.js";

/** Tasks keep their audit history; completion uses approved closure, so delete and suspend actions are omitted. */
export const taskModule = {
  key: "crm.task",
  register: (app: FastifyInstance, context: (request: FastifyRequest) => Promise<TaskContext>) =>
    registerTaskRoutes(app, context)
};
