import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createMariaDbDataProvider,
  createSqliteDataProvider,
  MigrationRunner,
  type KyselyDataProvider,
} from "@codexsun/platform-core";
import type { IdentityRepository } from "./repository/identity.repository.js";
import type { IdentityDatabase } from "./identity.database.js";
import { identityMigration } from "./migrations/identity.migration.js";
import { identitySeeder } from "./seeders/identity.seeder.js";
import { KyselyIdentityRepository } from "./repository/identity.repository.js";

export interface PlatformIdentityStoreConfiguration {
  readonly connectionUrl: string;
  readonly sqliteFilename: string;
  readonly appMode: "development" | "production";
}

export interface PlatformIdentityStore {
  readonly repository: IdentityRepository;
  close(): Promise<void>;
}

export async function createPlatformIdentityStore(
  configuration: PlatformIdentityStoreConfiguration,
): Promise<PlatformIdentityStore> {
  const provider = await createProvider(configuration);
  const database = provider.queryDatabase();
  const runner = new MigrationRunner(database);
  const plan = {
    moduleId: "platform.identity",
    migrations: [identityMigration],
    seeders: [identitySeeder],
  } as const;
  if (configuration.appMode === "production") await runner.assertApplied(plan);
  else await runner.run(plan);

  return {
    repository: new KyselyIdentityRepository(database),
    close: () => provider.destroy(),
  };
}

async function createProvider(
  configuration: PlatformIdentityStoreConfiguration,
): Promise<KyselyDataProvider<IdentityDatabase>> {
  const protocol = new URL(configuration.connectionUrl).protocol;
  if (protocol === "mysql:") return createMariaDbDataProvider<IdentityDatabase>({ connectionUrl: configuration.connectionUrl });
  if (protocol !== "sqlite:") throw new Error("Platform identity requires a mysql:// or sqlite:// connection URL.");

  if (configuration.sqliteFilename !== ":memory:") {
    await mkdir(resolve(configuration.sqliteFilename, ".."), { recursive: true });
  }
  return createSqliteDataProvider<IdentityDatabase>({ filename: configuration.sqliteFilename });
}
