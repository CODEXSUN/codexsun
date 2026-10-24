import "@codexsun/framework/api";
import type { FastifyInstance } from "fastify";
import { commonTableImportModule } from "./modules/common-table-import/common-table-import.module.js";
import { migrateDataBridgeDatabase } from "./modules/common-table-import/common-table-import.migration.js";
import type { CommonTableImportHost } from "./modules/common-table-import/common-table-import.types.js";

export { migrateDataBridgeDatabase };
export { CommonBulkService } from "./modules/common-table-import/common-table-import.bulk.service.js";
export type { CommonTableImportHost } from "./modules/common-table-import/common-table-import.types.js";
export const dataBridgeApiModuleKeys = [commonTableImportModule.key] as const;

export async function registerDataBridgeApi(app: FastifyInstance, host: CommonTableImportHost) {
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", async (request) => {
        await host.authorize(request);
      });
      commonTableImportModule.register(scope, host);
    },
    { prefix: "/api/data-bridge" }
  );
}

export { TransferService } from "./modules/common-table-import/common-table-import.transfer.service.js";
export { ConflictResolutionService } from "./modules/common-table-import/common-table-import.resolution.service.js";
