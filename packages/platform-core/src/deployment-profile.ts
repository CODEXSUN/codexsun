import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ModuleProvider } from "@codexsun/framework";
import type { DeployableProfile } from "./module-enablement-policy.js";

type ApplicationManifest = { id: string; providers: string[] };
type AddonManifest = { dependencies: string[]; id: string; package: string; providerId: string };
type RegistryProfile = {
  enabledAddons: string[];
  enabledApplications: string[];
  enabledProviders?: Record<string, string[]>;
  id: string;
};

export interface ApplicationDeployableProfile extends DeployableProfile {
  readonly addons: readonly AddonManifest[];
}

export function readApplicationDeployableProfile(options: ApplicationProfileOptions): ApplicationDeployableProfile {
  const registryRoot = findRegistryRoot(options.registryRoot ?? process.cwd());
  const profileId = options.profileId ?? process.env.CODEXSUN_DEPLOYMENT_PROFILE ?? "development";
  const profile = readJson<RegistryProfile>(resolve(registryRoot, "core", "registry", "profiles", `${profileId}.json`));
  const application = readJson<ApplicationManifest>(resolve(registryRoot, "core", "registry", "applications", `${options.applicationId}.json`));
  if (!profile.enabledApplications.includes(options.applicationId)) {
    throw new Error(`Deployment profile ${profile.id} does not enable application ${options.applicationId}.`);
  }

  const selectedProviderIds = profile.enabledProviders?.[options.applicationId] ?? application.providers;
  validateProviderSelection(profile.id, options.applicationId, selectedProviderIds, application.providers, options.availableProviderIds);
  const addons = readEnabledAddons(registryRoot, profile);
  return {
    id: `${profile.id}:${options.applicationId}`,
    enabledProviderIds: [...selectedProviderIds, ...addons.map((addon) => addon.providerId)],
    addons,
  };
}

export interface ApplicationProfileOptions {
  readonly applicationId: string;
  readonly availableProviderIds: readonly string[];
  readonly profileId?: string;
  readonly registryRoot?: string;
}

function findRegistryRoot(startDirectory: string): string {
  let directory = resolve(startDirectory);
  while (true) {
    if (existsSync(resolve(directory, "core", "registry"))) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error("Could not find the CODEXSUN registry root.");
    directory = parent;
  }
}

export async function loadEnabledAddonProviders(profile: ApplicationDeployableProfile): Promise<ModuleProvider[]> {
  return Promise.all(
    profile.addons.map(async (addon) => {
      const loaded = (await import(addon.package)) as { createAddonProvider?: () => ModuleProvider };
      if (typeof loaded.createAddonProvider !== "function") {
        throw new Error(`Enabled add-on ${addon.id} must export createAddonProvider().`);
      }
      const provider = loaded.createAddonProvider();
      if (provider.manifest.id !== addon.providerId) {
        throw new Error(`Enabled add-on ${addon.id} exported ${provider.manifest.id}, expected ${addon.providerId}.`);
      }
      return provider;
    }),
  );
}

function validateProviderSelection(
  profileId: string,
  applicationId: string,
  selected: readonly string[],
  declared: readonly string[],
  available: readonly string[],
): void {
  if (!selected.length) throw new Error(`Deployment profile ${profileId} enables no providers for ${applicationId}.`);
  const declaredIds = new Set(declared);
  const availableIds = new Set(available);
  for (const providerId of selected) {
    if (!declaredIds.has(providerId)) {
      throw new Error(`Deployment profile ${profileId} enables undeclared provider ${providerId} for ${applicationId}.`);
    }
    if (!availableIds.has(providerId)) {
      throw new Error(`Deployment profile ${profileId} enables unavailable provider ${providerId} for ${applicationId}.`);
    }
  }
}

function readEnabledAddons(root: string, profile: RegistryProfile): AddonManifest[] {
  const addons = new Map<string, AddonManifest>();
  for (const id of profile.enabledAddons ?? []) {
    const addon = readJson<AddonManifest>(resolve(root, "core", "registry", "addons", `${id}.json`));
    addons.set(addon.id, addon);
  }
  for (const addon of addons.values()) {
    for (const dependency of addon.dependencies) {
      if (!addons.has(dependency)) throw new Error(`Deployment profile ${profile.id} enables ${addon.id} without add-on dependency ${dependency}.`);
    }
  }
  return [...addons.values()];
}

function readJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    throw new Error(`Could not read deployment registry file ${path}: ${(error as Error).message}`);
  }
}
