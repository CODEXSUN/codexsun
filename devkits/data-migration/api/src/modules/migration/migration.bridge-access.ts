import type { DataMigrationHost } from "./migration.types.js";
import { MigrationRepository } from "./migration.repository.js";

export function createDataMigrationBridgeAccess(host: DataMigrationHost) {
  const repository = new MigrationRepository(host.database);
  return {
    listSources: () => repository.listSources(),
    resolveSource: (id: number) => repository.resolveSource(id, host.secretKey)
  };
}

export type DataMigrationBridgeAccess = ReturnType<typeof createDataMigrationBridgeAccess>;
