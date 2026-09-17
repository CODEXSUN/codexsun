import { type ModuleProvider, ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "./index.js";
import { type DeployableProfile, ModuleEnablementPolicy } from "./module-enablement-policy.js";

export class PlatformRuntime {
  constructor(
    readonly engine: ProviderEngine,
    readonly enabledProviderIds: readonly string[],
  ) {}

  start(): void {
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
  }
}

export class PlatformRuntimeRegistry {
  private readonly providers = new Map<string, ModuleProvider>();

  include(provider: ModuleProvider): this {
    const providerId = provider.manifest.id;
    if (this.providers.has(providerId)) {
      throw new Error(`Platform runtime already includes provider: ${providerId}`);
    }

    this.providers.set(providerId, provider);
    return this;
  }

  compose(profile: DeployableProfile): PlatformRuntime {
    const engine = new ProviderEngine();
    const policy = new ModuleEnablementPolicy();
    for (const provider of policy.select(profile, [...this.providers.values()])) engine.register(provider);
    return new PlatformRuntime(engine, engine.ids());
  }
}

export function createPlatformRuntime(
  profile: DeployableProfile,
  applicationProviders: readonly ModuleProvider[],
): PlatformRuntime {
  const registry = new PlatformRuntimeRegistry();
  registry.include(new PlatformProvider());
  for (const provider of applicationProviders) registry.include(provider);
  return registry.compose(profile);
}
