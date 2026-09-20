import { createMariaDbDataProvider, readDatabaseConnectionUrl, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import { sql, type Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "./qcafe-foundation.database.js";
import { createQcafePersistence, type QcafePersistenceConfiguration } from "./qcafe-persistence.js";
import { readQcafePersistenceConfiguration } from "./qcafe-persistence-configuration.js";

export interface QcafeDatabaseSmokeResult {
  readonly driver: "mariadb" | "sqlite";
  readonly lifecycleRecords: number;
  readonly migrations: readonly string[];
}

export async function verifyQcafeDatabases(
  environment: NodeJS.ProcessEnv,
  localDatabasePath: string,
  plans?: readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[],
): Promise<readonly QcafeDatabaseSmokeResult[]> {
  const sqlite = await verifyDatabase({ localDatabasePath, mode: "local" }, "sqlite", plans);
  await ensureConfiguredMariaDbDatabase(environment);
  const mariaConfiguration = readQcafePersistenceConfiguration(
    { ...environment, DB_DRIVER: "mariadb" },
    localDatabasePath,
  );
  const mariadb = await verifyDatabase(mariaConfiguration, "mariadb", plans);
  return [sqlite, mariadb];
}

export async function verifyQcafeSqlite(localDatabasePath: string): Promise<QcafeDatabaseSmokeResult> {
  return verifyDatabase({ localDatabasePath, mode: "local" }, "sqlite");
}

export async function ensureConfiguredMariaDbDatabase(environment: NodeJS.ProcessEnv): Promise<void> {
  const connectionUrl = readDatabaseConnectionUrl({ ...environment, DB_DRIVER: "mariadb" });
  const targetUrl = new URL(connectionUrl);
  const databaseName = decodeURIComponent(targetUrl.pathname.slice(1));
  assertDatabaseName(databaseName);

  const adminUrl = new URL(targetUrl);
  adminUrl.pathname = "/mysql";
  const provider = createMariaDbDataProvider<Record<string, never>>({ connectionUrl: adminUrl.toString() });
  try {
    await sql.raw(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``).execute(provider.queryDatabase());
  } finally {
    await provider.destroy();
  }
}

async function verifyDatabase(
  configuration: QcafePersistenceConfiguration,
  driver: QcafeDatabaseSmokeResult["driver"],
  plans?: readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[],
): Promise<QcafeDatabaseSmokeResult> {
  const persistence = createQcafePersistence(configuration, plans);
  try {
    const migrations = await persistence.initialize();
    await assertConnection(persistence.database());
    const records = await persistence.verify();
    return { driver, lifecycleRecords: records.length, migrations };
  } finally {
    await persistence.destroy();
  }
}

async function assertConnection(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
  const result = await sql<{ value: number }>`select 1 as value`.execute(database);
  if (Number(result.rows[0]?.value) !== 1) throw new Error("Database smoke query failed.");
}

function assertDatabaseName(databaseName: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/u.test(databaseName)) {
    throw new Error("DB_MASTER_NAME must contain only letters, numbers, underscores, or hyphens.");
  }
}
