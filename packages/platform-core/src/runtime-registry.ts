import { type ModuleProvider, ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "./index.js";

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

  compose(): PlatformRuntime {
    const engine = new ProviderEngine();
    for (const provider of this.providers.values()) engine.register(provider);
    return new PlatformRuntime(engine, engine.ids());
  }
}

export function createPlatformRuntime(applicationProviders: readonly ModuleProvider[]): PlatformRuntime {
  const registry = new PlatformRuntimeRegistry();
  registry.include(new PlatformProvider());
  for (const provider of applicationProviders) registry.include(provider);
  return registry.compose();
}
