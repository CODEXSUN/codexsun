import type { FastifyInstance } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { registerSettingsRoutes } from "./settings.routes.js";
export const settingsModule = {
  key: "qcafe.settings",
  capabilities: { events: false, worker: false, sync: false }
};
export function registerSettingsModule(app: FastifyInstance, dependencies: QCafeDependencies) {
  registerSettingsRoutes(app, dependencies);
}
