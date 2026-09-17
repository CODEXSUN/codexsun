import Fastify, { LogController } from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import type { LoggerOptions } from "pino";
import { registerHttpSecurity } from "./http-security.js";
import { LoggerProvider, platformLoggerOptionsKey } from "./logger.js";
import { registerRequestLogging } from "./request-logging.js";
import { registerRootRoute } from "./root-route.js";
import { IdentityModuleProvider } from "./modules/identity/provider.js";
import { OperationsModuleProvider } from "./modules/operations/provider.js";
import { SettingsModuleProvider } from "./modules/settings/provider.js";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { readConfig } from "./config.js";
import { registerPlatformRoutes } from "./routes.js";
import { createServerShutdown, installServerShutdownHandlers } from "./server-shutdown.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  {
    id: "platform.local",
    enabledProviderIds: [
      "platform.core",
      "platform.logger",
      "platform.identity",
      "platform.operations",
      "platform.settings",
      "platform.system",
    ],
  },
  [
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
    ),
    new OperationsModuleProvider(),
    new SettingsModuleProvider({ deploymentName: config.PLATFORM_DEPLOYMENT_NAME }),
    new SystemModuleProvider(),
  ],
  { storageRoot: resolve(process.cwd(), config.STORAGE_ROOT) },
);
const { engine } = runtime;
runtime.start();
const app = Fastify({
  logger: engine.require<LoggerOptions>(platformLoggerOptionsKey),
  logController: new LogController({ disableRequestLogging: true }),
});
await registerHttpSecurity(app, config.PLATFORM_WEB_ORIGIN);
registerRequestLogging(app);
app.addHook("onClose", () => runtime.stop());
registerRootRoute(app, engine, config.PLATFORM_WEB_ORIGIN);
await registerPlatformRoutes(app, engine);
installServerShutdownHandlers(createServerShutdown(app));
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
