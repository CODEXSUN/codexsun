import type { CacheStore, ModuleProvider, ProviderRegistrationContext, SessionStore } from "@codexsun/framework";

export interface SessionCacheProviderConfiguration {
  readonly cache?: CacheStore;
  readonly session?: SessionStore;
}

/** Optional provider. Omit it when an app does not need shared cache or cookie sessions. */
export class SessionCacheProvider implements ModuleProvider {
  readonly manifest = {
    id: "platform.session-cache",
    owner: "packages/platform-core",
    version: "1.0.0",
    dependencies: ["platform.core"],
    contracts: ["platform.cache", "platform.session"],
    events: { published: [], consumed: [] },
  };

  constructor(private readonly configuration: SessionCacheProviderConfiguration) {}

  register(context: ProviderRegistrationContext): void {
    if (this.configuration.cache) context.provide("cache", this.configuration.cache);
    if (this.configuration.session) context.provide("session", this.configuration.session);
  }
}
