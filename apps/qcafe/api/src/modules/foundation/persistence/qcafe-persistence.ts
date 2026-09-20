import {
  createMariaDbDataProvider,
  createSqliteDataProvider,
  MigrationRunner,
  type KyselyDataProvider,
} from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "./qcafe-foundation.database.js";

export type QcafeDataMode = "cloud" | "local";

export interface QcafePersistenceConfiguration {
  readonly cloudDatabaseUrl?: string;
  readonly localDatabasePath: string;
  readonly mode: QcafeDataMode;
  readonly syncCloudUrl?: string;
}

export class QcafePersistence {
  constructor(
    readonly configuration: QcafePersistenceConfiguration,
    private readonly provider: KyselyDataProvider<QcafeFoundationDatabase>,
  ) {}

  async initialize(): Promise<readonly string[]> {
    return new MigrationRunner(this.provider.queryDatabase()).run({
      moduleId: "qcafe.foundation",
      migrations: [qcafeFoundationMigration],
      seeders: [],
    });
  }

  async destroy(): Promise<void> {
    await this.provider.destroy();
  }
}

export function createQcafePersistence(configuration: QcafePersistenceConfiguration): QcafePersistence {
  const provider =
    configuration.mode === "cloud"
      ? createMariaDbDataProvider<QcafeFoundationDatabase>({ connectionUrl: requiredCloudUrl(configuration) })
      : createSqliteDataProvider<QcafeFoundationDatabase>({ filename: configuration.localDatabasePath });
  return new QcafePersistence(configuration, provider);
}

const qcafeFoundationMigration = {
  id: "qcafe.foundation.001",
  owner: "qcafe.foundation",
  async apply(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    await database.schema
      .createTable("qcafe_foundation_metadata")
      .ifNotExists()
      .addColumn("key", "varchar(120)", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();
  },
};

function requiredCloudUrl(configuration: QcafePersistenceConfiguration): string {
  if (!configuration.cloudDatabaseUrl) throw new Error("Set QCAFE_CLOUD_DATABASE_URL for cloud mode.");
  return configuration.cloudDatabaseUrl;
}
