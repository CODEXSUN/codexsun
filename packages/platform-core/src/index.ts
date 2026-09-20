import {
  DatabaseProvider,
  DbConfigProvider,
  EnvironmentProvider,
  type ModuleProvider,
  ProviderRegistrationContext,
  SettingsProvider,
} from "@codexsun/framework";
import { StorageProvider } from "./storage-provider.js";
import { readDatabaseConnectionUrl } from "./database-configuration.js";

export { createPlatformRuntime, PlatformRuntime, PlatformRuntimeRegistry } from "./runtime-registry.js";
export { ModuleEnablementPolicy } from "./module-enablement-policy.js";
export type { DeployableProfile } from "./module-enablement-policy.js";
export { loadEnabledAddonProviders, readApplicationDeployableProfile } from "./deployment-profile.js";
export type { ApplicationDeployableProfile } from "./deployment-profile.js";
export type { ApplicationProfileOptions } from "./deployment-profile.js";
export { KyselyDataProvider } from "./kysely-data-provider.js";
export type { KyselyTransactionWork } from "./kysely-data-provider.js";
export { createSqliteDataProvider } from "./sqlite-data-provider.js";
export type { SqliteDataProviderOptions } from "./sqlite-data-provider.js";
export { createMariaDbDataProvider } from "./mariadb-data-provider.js";
export type { MariaDbDataProviderOptions } from "./mariadb-data-provider.js";
export { buildMariaDbConnectionUrl, readDatabaseConnectionUrl } from "./database-configuration.js";
export type { DatabaseDriver, MariaDbEnvironmentConfiguration } from "./database-configuration.js";
export { DatabaseOutbox } from "./database-outbox.js";
export type { DatabaseOutboxSchema, OutboxMessage, OutboxState, OutboxStateCounts } from "./database-outbox.js";
export { DatabaseOutboxWorker } from "./database-outbox-worker.js";
export type { DatabaseOutboxHandler, DatabaseOutboxWorkerConfiguration } from "./database-outbox-worker.js";
export { DatabaseOutboxEventBridge } from "./database-outbox-event-bridge.js";
export { DatabaseOutboxEventDispatcher } from "./database-outbox-event-dispatcher.js";
export { DatabaseJobQueue } from "./database-job-queue.js";
export type {
  DatabaseJob,
  DatabaseJobQueueSchema,
  DatabaseJobState,
  DatabaseJobStateCounts,
} from "./database-job-queue.js";
export { DatabaseJobWorker } from "./database-job-worker.js";
export type {
  DatabaseJobHandler,
  DatabaseJobWorkerConfiguration,
  DatabaseJobWorkerResult,
} from "./database-job-worker.js";
export { DatabaseNotificationStore } from "./database-notifications.js";
export type {
  DatabaseNotificationSchema,
  NotificationListOptions,
  NotificationSeverity,
  PlatformNotification,
} from "./database-notifications.js";
export { ModuleStorage, StorageProvider } from "./storage-provider.js";
export type { StorageVisibility } from "./storage-provider.js";
export { createOperationLogEntry } from "./observability.js";
export type { OperationLogEntry } from "./observability.js";
export { EnvironmentSecretProvider } from "./environment-secret-provider.js";
export { parseCsv, stringifyCsv } from "./csv.js";
export { signWebhookPayload, verifyWebhookPayload } from "./webhook-signature.js";
export { FileCacheStore, FileSessionStore } from "./file-session-cache.js";
export { DatabaseCacheStore, DatabaseSessionStore, sessionCacheMigration } from "./database-session-cache.js";
export type { SessionCacheDatabase } from "./database-session-cache.js";
export { SessionCacheProvider } from "./session-cache-provider.js";
export type { SessionCacheProviderConfiguration } from "./session-cache-provider.js";
export { sessionCookieOptions } from "./session-cookie.js";
export type { SessionCookieOptions } from "./session-cookie.js";
export { fastifyHelmetOptions } from "./http-security.js";
export { createPlatformJwtToken, defaultPlatformJwtAudience, defaultPlatformJwtIssuer } from "./platform-jwt.js";
export type { PlatformJwtClaims, PlatformJwtConfiguration, PlatformJwtTokenInput } from "./platform-jwt.js";
export {
  hashIdentityPassword,
  identityBrowserSessionIdSchema,
  identityErrorResponseSchema,
  identityLoginResponseSchema,
  identityLoginSchema,
  identityPasswordResetAcceptedSchema,
  identityPasswordResetConfirmationSchema,
  identityPasswordResetRequestSchema,
  readPlatformJwtClaims,
  verifyIdentityPassword,
  verifyPlatformJwt,
} from "./identity-security.js";
export type {
  IdentityLogin,
  IdentityLoginResponse,
  IdentityPasswordResetConfirmation,
  IdentityPasswordResetRequest,
} from "./identity-security.js";
export { IdentityLoginRateLimitError, LocalIdentityStore } from "./local-identity.js";
export type {
  IdentityPermissionAssignment,
  IdentityRoleAssignment,
  IdentitySeed,
  IdentityUserState,
  IdentityUserUpsert,
  LocalIdentityConfiguration,
  ManagedIdentityUser,
  PasswordResetRequest,
} from "./local-identity.js";
export { registerIdentityManagementRoutes } from "./identity-management-http.js";
export type { IdentityManagementRouteOptions } from "./identity-management-http.js";
export { readLocalIdentityConfiguration } from "./identity-configuration.js";
export { ModuleDataLifecyclePolicy } from "./data-lifecycle-policy.js";
export type {
  DataCompatibilityLevel,
  DataCompatibilityRecord,
  ModuleDataLifecyclePlan,
} from "./data-lifecycle-policy.js";
export { createLifecycleChecksum } from "./migration-integrity.js";
export { MigrationRunner } from "./migration-runner.js";
export type {
  DatabaseLifecyclePlan,
  DatabaseLifecycleRecord,
  DatabaseMigration,
  DatabaseSeeder,
} from "./migration-runner.js";
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
  desktopRuntimeConfigSchema,
  mobileRuntimeConfigSchema,
  readZetroApiRuntimeConfig,
  readZetroWebRuntimeConfig,
  readRedisRuntimeConfig,
  readApiRuntimeConfig,
  readDesktopRuntimeConfig,
  readMobileRuntimeConfig,
  readUiuxWebRuntimeConfig,
  readWebRuntimeConfig,
  redisRuntimeConfigSchema,
  webRuntimeConfigSchema,
  uiuxWebRuntimeConfigSchema,
  zetroApiRuntimeConfigSchema,
  zetroWebRuntimeConfigSchema,
} from "./runtime-config.js";
export type {
  ApiRuntimeConfig,
  DesktopRuntimeConfig,
  MobileRuntimeConfig,
  RedisRuntimeConfig,
  WebRuntimeConfig,
  ZetroApiRuntimeConfig,
  ZetroWebRuntimeConfig,
  UiuxWebRuntimeConfig,
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
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    const environment = new EnvironmentProvider(process.env);
    const dbConfig = new DbConfigProvider({ url: readDatabaseConnectionUrl(process.env) });
    context.provide("environment", environment);
    context.provide("dbConfig", dbConfig);
    context.provide("database", new DatabaseProvider(dbConfig));
    context.provide("settings", new SettingsProvider({ environment: environment.optional("NODE_ENV", "development") }));
    context.provide("storage", new StorageProvider(this.configuration.storageRoot ?? "storage/apps"));
  }
}
