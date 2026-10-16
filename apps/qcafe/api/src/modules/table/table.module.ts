import type { FastifyInstance } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { registerTableRoutes } from "./table.routes.js";
export function registerTableModule(app: FastifyInstance, deps: QCafeDependencies) {
  registerTableRoutes(app, deps);
}

export const tableModule = {
  key: "qcafe.table",
  capabilities: { events: false, worker: false, sync: false }
};
