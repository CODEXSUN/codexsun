import type { FastifyInstance } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { registerSpecialRoutes } from "./special.routes.js";
export const specialModule = {
  key: "qcafe.special",
  capabilities: { events: false, worker: false, sync: false }
};
export function registerSpecialModule(app: FastifyInstance, dependencies: QCafeDependencies) {
  registerSpecialRoutes(app, dependencies);
}
