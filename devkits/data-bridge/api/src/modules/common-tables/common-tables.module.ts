import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerCommonTablesRoutes } from "./common-tables.routes.js";
// Catalog/connection orchestration owns no tenant entities, seeds, events, or independent storage.
export function registerCommonTables(app: FastifyInstance, host: CommonTableImportHost) {
  registerCommonTablesRoutes(app, host);
}
