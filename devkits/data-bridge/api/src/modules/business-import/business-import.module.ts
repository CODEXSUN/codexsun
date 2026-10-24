import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerBusinessImportRoutes } from "./business-import.routes.js";
// Run records and a queue worker exist. There are no seeds, public events, or offline sync.
export const businessImportModule = {
  key: "data-bridge.business-import",
  register: registerBusinessImportRoutes
};
export function registerBusinessImport(app: FastifyInstance, host: CommonTableImportHost) {
  businessImportModule.register(app, host);
}
