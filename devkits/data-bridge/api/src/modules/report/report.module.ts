import type { FastifyInstance } from "fastify";
import type { CommonTableImportHost } from "../import-review/index.js";
import { registerCommonBulkRoutes } from "./report.routes.js";
import { registerConflictResolutionRoutes } from "./report.resolution.routes.js";
import { registerReportHistoryRoutes } from "./report.history.routes.js";
// Durable jobs are dispatched by Platform; this owner retains reports and correction plans.
export function registerReport(app: FastifyInstance, host: CommonTableImportHost) {
  registerCommonBulkRoutes(app, host);
  registerConflictResolutionRoutes(app, host);
  registerReportHistoryRoutes(app, host);
}
