import type { FastifyInstance } from "fastify";
import type { MenuDependencies } from "./menu.types.js";
import { registerMenuRoutes } from "./menu.routes.js";

export const menuModule = {
  key: "qcafe.menu",
  capabilities: { events: false, worker: false, sync: false }
};

// Menu entries keep their identity for bill history. Deactivation replaces deletion.
// Synchronous module: no events, worker, or offline sync in the web release.
export function registerMenuModule(app: FastifyInstance, dependencies: MenuDependencies) {
  registerMenuRoutes(app, dependencies);
}
