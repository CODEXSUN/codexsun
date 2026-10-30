import type { FastifyInstance } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { registerWaiterRoutes } from "./waiter.routes.js";
export function registerWaiterModule(app: FastifyInstance, deps: QCafeDependencies) {
  registerWaiterRoutes(app, deps);
}
export const waiterModule = {
  key: "qcafe.waiter",
  capabilities: { events: false, worker: false, sync: false }
};
