import { registerTransferRoutes } from "./common-table-import.transfer.routes.js";
import { registerConflictResolutionRoutes } from "./common-table-import.resolution.routes.js";
import type { FastifyInstance } from "fastify";
import { registerCommonTableImportRoutes } from "./common-table-import.routes.js";
import type { CommonTableImportHost } from "./common-table-import.types.js";
import { registerCommonBulkRoutes } from "./common-table-import.bulk.routes.js";

export const commonTableImportModule = {
  key: "data-bridge.common-table-import",
  register(app: FastifyInstance, host: CommonTableImportHost) {
    registerCommonTableImportRoutes(app, host);
    registerCommonBulkRoutes(app, host);
    registerTransferRoutes(app, host);
    registerConflictResolutionRoutes(app, host);
  }
};
