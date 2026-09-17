import {
  DatabaseProvider,
  DbConfigProvider,
  EnvironmentProvider,
  type ModuleProvider,
  ProviderRegistrationContext,
  SettingsProvider,
} from "@codexsun/framework";

export { createPlatformRuntime, PlatformRuntime, PlatformRuntimeRegistry } from "./runtime-registry.js";
export {
  apiRuntimeConfigSchema,
  desktopRuntimeConfigSchema,
  mobileRuntimeConfigSchema,
  readApiRuntimeConfig,
  readDesktopRuntimeConfig,
  readMobileRuntimeConfig,
  readWebRuntimeConfig,
  webRuntimeConfigSchema,
} from "./runtime-config.js";
export type {
  ApiRuntimeConfig,
  DesktopRuntimeConfig,
  MobileRuntimeConfig,
  WebRuntimeConfig,
} from "./runtime-config.js";

export class PlatformProvider implements ModuleProvider {
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
  }
}
