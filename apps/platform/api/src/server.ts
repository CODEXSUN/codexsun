import Fastify from "fastify";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { JwtIdentityAuthenticator } from "./modules/identity/auth/jwt-identity-authenticator.js";
import { IdentityController } from "./modules/identity/controller/identity.controller.js";
import { IdentityModuleProvider } from "./modules/identity/provider.js";
import { registerIdentityRoutes } from "./modules/identity/routes/identity-routes.js";
import { SettingsController } from "./modules/settings/controller/settings.controller.js";
import { SettingsModuleProvider } from "./modules/settings/provider.js";
import { registerSettingsRoutes } from "./modules/settings/routes/settings-routes.js";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { registerHealthRoute } from "./modules/system/routes/health-route.js";
import { readConfig } from "./config.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  {
    id: "platform.local",
    enabledProviderIds: ["platform.core", "platform.identity", "platform.settings", "platform.system"],
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
    new SettingsModuleProvider({ deploymentName: config.PLATFORM_DEPLOYMENT_NAME }),
    new SystemModuleProvider(),
  ],
);
const { engine } = runtime;
runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
await registerHealthRoute(app, engine);
await registerIdentityRoutes(
  app,
  engine.require<IdentityController>("identity.controller"),
  engine.require<JwtIdentityAuthenticator>("identity.authenticator"),
);
await registerSettingsRoutes(app, engine.require<SettingsController>("settings.controller"), (authorization) =>
  engine.require<JwtIdentityAuthenticator>("identity.authenticator").authenticate(authorization),
);
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
