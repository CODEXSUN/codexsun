import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerDatabaseConnectionRoutes } from "./database-connection.routes.js";
// Catalog/connection orchestration owns no tenant entities, seeds, events, or independent storage.
export function registerDatabaseConnection(app: FastifyInstance, host: CommonTableImportHost) {
  registerDatabaseConnectionRoutes(app, host);
}
