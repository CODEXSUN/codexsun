import { type ModuleProvider, ProviderEngine, type ProviderManifest } from "./index.js";

export interface ProviderFixture {
  readonly engine: ProviderEngine;
  readonly events: string[];
  provider(manifest: ProviderManifest, lifecycle?: Partial<ModuleProvider>): ModuleProvider;
}

export function createProviderFixture(): ProviderFixture {
  const events: string[] = [];

  return {
    engine: new ProviderEngine(),
    events,
    provider(manifest, lifecycle = {}) {
      return {
        manifest,
        register: lifecycle.register ?? (() => undefined),
        start: lifecycle.start,
        stop: lifecycle.stop,
      };
    },
  };
}
