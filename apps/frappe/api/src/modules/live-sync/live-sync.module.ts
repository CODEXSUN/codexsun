import type { FastifyInstance } from "fastify";
import { registerFrappeLiveSyncRoutes, type LiveSyncCallbacks } from "./live-sync.routes.js";
export const frappeLiveSyncModule = {
  key: "frappe.live-sync",
  register(app: FastifyInstance, callbacks: LiveSyncCallbacks) {
    registerFrappeLiveSyncRoutes(app, callbacks);
  }
};
