import {
  DatabaseProvider,
  DbConfigProvider,
  EnvironmentProvider,
  ProviderEngine,
  SettingsProvider,
} from "@codexsun/framework";

export class PlatformProvider {
  readonly id = "platform";
  register(engine: ProviderEngine): void {
    const environment = new EnvironmentProvider(process.env);
    const dbConfig = new DbConfigProvider({ url: environment.optional("DATABASE_URL", "sqlite://local") });
    engine.provide("environment", environment);
    engine.provide("dbConfig", dbConfig);
    engine.provide("database", new DatabaseProvider(dbConfig));
    engine.provide("settings", new SettingsProvider({ environment: environment.optional("NODE_ENV", "development") }));
  }
}

export function createPlatformEngine(): ProviderEngine {
  const engine = new ProviderEngine();
  engine.register(new PlatformProvider());
  return engine;
}
