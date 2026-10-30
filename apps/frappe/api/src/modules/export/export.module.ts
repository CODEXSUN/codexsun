import type { FastifyInstance } from "fastify";
import { registerFrappeExportRoutes, type ExportRouteCallbacks } from "./export.routes.js";

export const frappeExportModule = {
  key: "frappe.export",
  register(app: FastifyInstance, callbacks: ExportRouteCallbacks) {
    registerFrappeExportRoutes(app, callbacks);
  }
};
