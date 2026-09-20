import { resolve } from "node:path";
import { createPlatformRuntime, loadEnabledAddonProviders, readApplicationDeployableProfile } from "@codexsun/platform-core";
import { createPlatformApiApplication } from "./application.js";
import { LoggerProvider, platformLoggerOptionsKey } from "./logger.js";
import { IdentityModuleProvider } from "./modules/identity/provider.js";
import { createPlatformIdentityStore } from "./modules/identity/identity-store.js";
import { OperationsModuleProvider } from "./modules/operations/provider.js";
import { SettingsModuleProvider } from "./modules/settings/provider.js";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { readConfig } from "./config.js";
import { createServerShutdown, installServerShutdownHandlers } from "./server-shutdown.js";
import { createPlatformTelemetry } from "./telemetry.js";

const config = readConfig();
const identityStore = await createPlatformIdentityStore({
  connectionUrl: config.DATABASE_URL,
  sqliteFilename: resolve(process.cwd(), config.STORAGE_ROOT, "private", "platform", "data", "platform.db"),
  appMode: config.APP_MODE,
});
const applicationProviders = [
  new LoggerProvider(config.NODE_ENV),
  new IdentityModuleProvider(
    {
      secret: config.PLATFORM_JWT_SECRET,
      issuer: config.PLATFORM_JWT_ISSUER,
      audience: config.PLATFORM_JWT_AUDIENCE,
    },
    {
      deploymentName: config.PLATFORM_DEPLOYMENT_NAME,
      bootstrapAdminEmail: config.PLATFORM_BOOTSTRAP_ADMIN_EMAIL,
    },
    identityStore.repository,
  ),
  new OperationsModuleProvider(),
  new SettingsModuleProvider({ deploymentName: config.PLATFORM_DEPLOYMENT_NAME }),
  new SystemModuleProvider(),
];
const profile = readApplicationDeployableProfile({
  applicationId: "platform",
  availableProviderIds: ["platform.core", ...applicationProviders.map((provider) => provider.manifest.id)],
});
const runtime = createPlatformRuntime(
  profile,
  [...applicationProviders, ...(await loadEnabledAddonProviders(profile))],
  { storageRoot: resolve(process.cwd(), config.STORAGE_ROOT) },
);
const { engine } = runtime;
runtime.start();
const telemetry = createPlatformTelemetry(config.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);
telemetry.start();
const app = await createPlatformApiApplication({
  engine,
  logger: engine.require(platformLoggerOptionsKey),
  webOrigin: config.PLATFORM_WEB_ORIGIN,
  stopRuntime: async () => {
    runtime.stop();
    await telemetry.stop();
    await identityStore.close();
  },
});
installServerShutdownHandlers(createServerShutdown(app));
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
