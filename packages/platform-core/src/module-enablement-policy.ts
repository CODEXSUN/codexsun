import type { ModuleProvider } from "@codexsun/framework";

export interface DeployableProfile {
  readonly id: string;
  readonly enabledProviderIds: readonly string[];
}

export class ModuleEnablementPolicy {
  select(profile: DeployableProfile, availableProviders: readonly ModuleProvider[]): ModuleProvider[] {
    this.validateProfile(profile);
    const availableById = new Map(availableProviders.map((provider) => [provider.manifest.id, provider]));
    const selected = profile.enabledProviderIds.map((providerId) => {
      const provider = availableById.get(providerId);
      if (!provider) throw new Error(`Deployable profile ${profile.id} enables unavailable provider: ${providerId}`);
      return provider;
    });

    this.validateDependencies(profile, selected);
    return selected;
  }

  private validateProfile(profile: DeployableProfile): void {
    if (!profile.id.trim()) throw new Error("Deployable profile requires an ID.");
    if (profile.enabledProviderIds.length === 0)
      throw new Error(`Deployable profile ${profile.id} enables no providers.`);
    if (new Set(profile.enabledProviderIds).size !== profile.enabledProviderIds.length) {
      throw new Error(`Deployable profile ${profile.id} lists a provider more than once.`);
    }
  }

  private validateDependencies(profile: DeployableProfile, selected: readonly ModuleProvider[]): void {
    const selectedIds = new Set(selected.map((provider) => provider.manifest.id));
    for (const provider of selected) {
      for (const dependencyId of provider.manifest.dependencies) {
        if (!selectedIds.has(dependencyId)) {
          throw new Error(
            `Deployable profile ${profile.id} omits dependency ${dependencyId} for ${provider.manifest.id}.`,
          );
        }
      }
    }
  }
}
