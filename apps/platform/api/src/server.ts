import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { IdentityModuleProvider } from "./modules/identity/provider.js";
import { OperationsModuleProvider } from "./modules/operations/provider.js";
import { SettingsModuleProvider } from "./modules/settings/provider.js";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { readConfig } from "./config.js";
import { registerPlatformRoutes } from "./routes.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  {
    id: "platform.local",
    enabledProviderIds: [
      "platform.core",
      "platform.identity",
      "platform.operations",
      "platform.settings",
      "platform.system",
    ],
  },
  [
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
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
await registerPlatformRoutes(app, engine);
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
