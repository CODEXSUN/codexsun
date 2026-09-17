import {
  DatabaseProvider,
  DbConfigProvider,
  EnvironmentProvider,
  type ModuleProvider,
  ProviderRegistrationContext,
  SettingsProvider,
} from "@codexsun/framework";
import { StorageProvider } from "./storage-provider.js";

export { createPlatformRuntime, PlatformRuntime, PlatformRuntimeRegistry } from "./runtime-registry.js";
export { ModuleEnablementPolicy } from "./module-enablement-policy.js";
export type { DeployableProfile } from "./module-enablement-policy.js";
export { KyselyDataProvider } from "./kysely-data-provider.js";
export type { KyselyTransactionWork } from "./kysely-data-provider.js";
export { createSqliteDataProvider } from "./sqlite-data-provider.js";
export type { SqliteDataProviderOptions } from "./sqlite-data-provider.js";
export { createMariaDbDataProvider } from "./mariadb-data-provider.js";
export type { MariaDbDataProviderOptions } from "./mariadb-data-provider.js";
export { DatabaseOutbox } from "./database-outbox.js";
export type { DatabaseOutboxSchema, OutboxMessage, OutboxState, OutboxStateCounts } from "./database-outbox.js";
export { DatabaseOutboxWorker } from "./database-outbox-worker.js";
export type { DatabaseOutboxHandler, DatabaseOutboxWorkerConfiguration } from "./database-outbox-worker.js";
export { ModuleStorage, StorageProvider } from "./storage-provider.js";
export type { StorageVisibility } from "./storage-provider.js";
export { createOperationLogEntry } from "./observability.js";
export type { OperationLogEntry } from "./observability.js";
export { ModuleDataLifecyclePolicy } from "./data-lifecycle-policy.js";
export type {
  DataCompatibilityLevel,
  DataCompatibilityRecord,
  ModuleDataLifecyclePlan,
} from "./data-lifecycle-policy.js";
export {
  actorKindSchema,
  actorSchema,
  authorizationRequirementSchema,
  authorize,
  identitySessionSchema,
  permissionSchema,
  roleSchema,
  sessionStateSchema,
} from "./identity-contracts.js";
export type {
  Actor,
  ActorKind,
  AuthorizationDecision,
  AuthorizationRequirement,
  IdentitySession,
  Permission,
  Role,
  SessionState,
} from "./identity-contracts.js";
export {
  apiRuntimeConfigSchema,
  docsApiRuntimeConfigSchema,
  docsWebRuntimeConfigSchema,
  desktopRuntimeConfigSchema,
  mobileRuntimeConfigSchema,
  readDocsApiRuntimeConfig,
  readDocsWebRuntimeConfig,
  readZetroApiRuntimeConfig,
  readZetroWebRuntimeConfig,
  readRedisRuntimeConfig,
  readApiRuntimeConfig,
  readDesktopRuntimeConfig,
  readMobileRuntimeConfig,
  readWebRuntimeConfig,
  redisRuntimeConfigSchema,
  webRuntimeConfigSchema,
  zetroApiRuntimeConfigSchema,
  zetroWebRuntimeConfigSchema,
} from "./runtime-config.js";
export type {
  ApiRuntimeConfig,
  DocsApiRuntimeConfig,
  DocsWebRuntimeConfig,
  DesktopRuntimeConfig,
  MobileRuntimeConfig,
  RedisRuntimeConfig,
  WebRuntimeConfig,
  ZetroApiRuntimeConfig,
  ZetroWebRuntimeConfig,
} from "./runtime-config.js";

export interface PlatformProviderConfiguration {
  readonly storageRoot?: string;
}

export class PlatformProvider implements ModuleProvider {
  constructor(private readonly configuration: PlatformProviderConfiguration = {}) {}

  readonly manifest = {
    id: "platform.core",
    owner: "packages/platform-core",
    version: "1.0.2",
    dependencies: [],
    contracts: ["environment", "database", "settings"],
  };

  register(context: ProviderRegistrationContext): void {
    const environment = new EnvironmentProvider(process.env);
    const dbConfig = new DbConfigProvider({ url: environment.optional("DATABASE_URL", "sqlite://local") });
    context.provide("environment", environment);
    context.provide("dbConfig", dbConfig);
    context.provide("database", new DatabaseProvider(dbConfig));
    context.provide("settings", new SettingsProvider({ environment: environment.optional("NODE_ENV", "development") }));
    context.provide("storage", new StorageProvider(this.configuration.storageRoot ?? "storage/apps"));
  }
}
