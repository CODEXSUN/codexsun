import type { FastifyInstance } from "fastify";
import type { OrderDependencies } from "./order.types.js";
import { registerOrderRoutes } from "./order.routes.js";
export function registerOrderModule(app: FastifyInstance, deps: OrderDependencies) {
  registerOrderRoutes(app, deps);
}

export const orderModule = {
  key: "qcafe.order",
  capabilities: { events: false, worker: false, sync: false }
};
