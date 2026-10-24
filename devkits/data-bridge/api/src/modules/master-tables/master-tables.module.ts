import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerMasterTablesRoutes } from "./master-tables.routes.js";
// Catalog/connection orchestration owns no tenant entities, seeds, events, or independent storage.
export function registerMasterTables(app: FastifyInstance, host: CommonTableImportHost) {
  registerMasterTablesRoutes(app, host);
}
