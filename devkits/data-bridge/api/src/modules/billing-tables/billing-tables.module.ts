import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerBillingTablesRoutes } from "./billing-tables.routes.js";
// Catalog/connection orchestration owns no tenant entities, seeds, events, or independent storage.
export function registerBillingTables(app: FastifyInstance, host: CommonTableImportHost) {
  registerBillingTablesRoutes(app, host);
}
