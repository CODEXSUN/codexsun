import type { FastifyInstance } from "fastify";
import type { PosDependencies } from "./pos.types.js";
import { registerPosRoutes } from "./pos.routes.js";

export const posModule = {
  key: "qcafe.pos",
  capabilities: { events: false, worker: false, sync: false }
};

// Bills own their lines and settlement ledger. Saved financial records are immutable.
// This synchronous online release has no delete, update, worker, event, or offline sync capability.
export function registerPosModule(app: FastifyInstance, dependencies: PosDependencies) {
  registerPosRoutes(app, dependencies);
}
