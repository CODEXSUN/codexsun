import {
  createMariaDbDataProvider,
  createSqliteDataProvider,
  createLifecycleChecksum,
  MigrationRunner,
  type DatabaseLifecyclePlan,
  type DatabaseLifecycleRecord,
  type KyselyDataProvider,
} from "@codexsun/platform-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
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
    private readonly plans: readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[] = [qcafeFoundationLifecyclePlan],
  ) {}

  async initialize(): Promise<readonly string[]> {
    const applied: string[] = [];
    for (const plan of this.plans) applied.push(...(await new MigrationRunner(this.provider.queryDatabase()).run(plan)));
    return applied;
  }

  async verify(): Promise<readonly DatabaseLifecycleRecord[]> {
    const records: DatabaseLifecycleRecord[] = [];
    for (const plan of this.plans) records.push(...(await new MigrationRunner(this.provider.queryDatabase()).verify(plan)));
    return records;
  }

  async destroy(): Promise<void> {
    await this.provider.destroy();
  }

  database(): Kysely<QcafeFoundationDatabase> {
    return this.provider.queryDatabase();
  }
}

export function createQcafePersistence(
  configuration: QcafePersistenceConfiguration,
  plans?: readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[],
): QcafePersistence {
  if (configuration.mode === "local") mkdirSync(dirname(configuration.localDatabasePath), { recursive: true });
  const provider =
    configuration.mode === "cloud"
      ? createMariaDbDataProvider<QcafeFoundationDatabase>({ connectionUrl: requiredCloudUrl(configuration) })
      : createSqliteDataProvider<QcafeFoundationDatabase>({ filename: configuration.localDatabasePath });
  return new QcafePersistence(configuration, provider, plans);
}

export async function prepareQcafePersistence(
  persistence: QcafePersistence,
  appMode: "development" | "production",
): Promise<void> {
  if (appMode === "production") await persistence.verify();
  else await persistence.initialize();
}

const qcafeFoundationMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.foundation.001|qcafe_foundation_metadata:key varchar(120) primary key,value text not null,updated_at varchar(40) not null",
  ),
  description: "Create Q Cafe Foundation compatibility metadata.",
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

const qcafeSetupMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.foundation.002|qcafe_businesses,qcafe_locations,qcafe_business_days,qcafe_service_channels,qcafe_number_sequences|business-location foreign keys|location channel and sequence uniqueness",
  ),
  description: "Create Q Cafe business and outlet setup tables.",
  id: "qcafe.foundation.002",
  owner: "qcafe.foundation",
  async apply(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    await createBusinessTable(database);
    await createLocationTable(database);
    await createBusinessDayTable(database);
    await createServiceChannelTable(database);
    await createNumberSequenceTable(database);
  },
};

const qcafeActivityMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.foundation.003|qcafe_activity_events|actor,subject,event,correlation,outcome,payload,occurred_at",
  ),
  description: "Create correlated Q Cafe activity events.",
  id: "qcafe.foundation.003",
  owner: "qcafe.foundation",
  async apply(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    await database.schema
      .createTable("qcafe_activity_events")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("event_type", "varchar(120)", (column) => column.notNull())
      .addColumn("actor_id", "varchar(120)", (column) => column.notNull())
      .addColumn("subject_type", "varchar(80)", (column) => column.notNull())
      .addColumn("subject_id", "varchar(120)", (column) => column.notNull())
      .addColumn("correlation_id", "varchar(36)", (column) => column.notNull())
      .addColumn("outcome", "varchar(16)", (column) => column.notNull())
      .addColumn("payload_json", "text")
      .addColumn("occurred_at", "varchar(40)", (column) => column.notNull())
      .execute();
  },
};

const qcafeFoundationSeeder = {
  checksum: createLifecycleChecksum(
    "qcafe.foundation.seed.001|qcafe_foundation_metadata|foundation.status=ready|insert when missing",
  ),
  description: "Record the repeat-safe Q Cafe Foundation readiness default.",
  id: "qcafe.foundation.seed.001",
  owner: "qcafe.foundation",
  async seed(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    const existing = await database
      .selectFrom("qcafe_foundation_metadata")
      .select("key")
      .where("key", "=", "foundation.status")
      .executeTakeFirst();
    if (existing) return;
    await database
      .insertInto("qcafe_foundation_metadata")
      .values({ key: "foundation.status", updated_at: "1970-01-01T00:00:00.000Z", value: "ready" })
      .execute();
  },
};

export const qcafeFoundationLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [qcafeFoundationMigration, qcafeSetupMigration, qcafeActivityMigration],
  moduleId: "qcafe.foundation",
  seeders: [qcafeFoundationSeeder],
};

async function createBusinessTable(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  await database.schema
    .createTable("qcafe_businesses")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("name", "varchar(160)", (column) => column.notNull())
    .addColumn("legal_name", "varchar(200)")
    .addColumn("currency", "varchar(3)", (column) => column.notNull())
    .addColumn("timezone", "varchar(80)", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

async function createLocationTable(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  await database.schema
    .createTable("qcafe_locations")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
    .addColumn("code", "varchar(40)", (column) => column.notNull())
    .addColumn("name", "varchar(160)", (column) => column.notNull())
    .addColumn("timezone", "varchar(80)", (column) => column.notNull())
    .addColumn("status", "varchar(16)", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .addUniqueConstraint("qcafe_locations_business_code_key", ["business_id", "code"])
    .execute();
}

async function createBusinessDayTable(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  await database.schema
    .createTable("qcafe_business_days")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("location_id", "varchar(36)", (column) => column.notNull().references("qcafe_locations.id"))
    .addColumn("business_date", "varchar(10)", (column) => column.notNull())
    .addColumn("status", "varchar(16)", (column) => column.notNull())
    .addColumn("opened_at", "varchar(40)", (column) => column.notNull())
    .addColumn("closed_at", "varchar(40)")
    .addUniqueConstraint("qcafe_business_days_location_date_key", ["location_id", "business_date"])
    .execute();
}

async function createServiceChannelTable(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  await database.schema
    .createTable("qcafe_service_channels")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("location_id", "varchar(36)", (column) => column.notNull().references("qcafe_locations.id"))
    .addColumn("code", "varchar(40)", (column) => column.notNull())
    .addColumn("name", "varchar(80)", (column) => column.notNull())
    .addColumn("kind", "varchar(24)", (column) => column.notNull())
    .addColumn("enabled", "integer", (column) => column.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addUniqueConstraint("qcafe_service_channels_location_code_key", ["location_id", "code"])
    .execute();
}

async function createNumberSequenceTable(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  await database.schema
    .createTable("qcafe_number_sequences")
    .ifNotExists()
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("location_id", "varchar(36)", (column) => column.notNull().references("qcafe_locations.id"))
    .addColumn("document_kind", "varchar(24)", (column) => column.notNull())
    .addColumn("prefix", "varchar(20)", (column) => column.notNull())
    .addColumn("next_value", "integer", (column) => column.notNull().defaultTo(1))
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .addUniqueConstraint("qcafe_number_sequences_location_kind_key", ["location_id", "document_kind"])
    .execute();
}

function requiredCloudUrl(configuration: QcafePersistenceConfiguration): string {
  if (!configuration.cloudDatabaseUrl) throw new Error("MariaDB mode requires the shared DB_* configuration.");
  return configuration.cloudDatabaseUrl;
}
