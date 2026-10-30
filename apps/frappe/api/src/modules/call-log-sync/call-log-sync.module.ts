import type { FastifyInstance } from "fastify";
import { registerCallLogImportRoutes, type CallLogImportRoutes } from "./call-log-sync.routes.js";

export const frappeCallLogSyncModule = {
  key: "frappe.call-log-sync",
  register(app: FastifyInstance, callbacks: CallLogImportRoutes) {
    registerCallLogImportRoutes(app, callbacks);
  }
};
