import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DeployableProfile } from "./module-enablement-policy.js";

type ApplicationManifest = { id: string; providers: string[] };
type RegistryProfile = {
  enabledApplications: string[];
  enabledProviders?: Record<string, string[]>;
  id: string;
};

export function readApplicationDeployableProfile(options: ApplicationProfileOptions): DeployableProfile {
  const registryRoot = findRegistryRoot(options.registryRoot ?? process.cwd());
  const profileId = options.profileId ?? process.env.CODEXSUN_DEPLOYMENT_PROFILE ?? "development";
  const profile = readJson<RegistryProfile>(resolve(registryRoot, "registry", "profiles", `${profileId}.json`));
  const application = readJson<ApplicationManifest>(resolve(registryRoot, "registry", "applications", `${options.applicationId}.json`));
  if (!profile.enabledApplications.includes(options.applicationId)) {
    throw new Error(`Deployment profile ${profile.id} does not enable application ${options.applicationId}.`);
  }

  const enabledProviderIds = profile.enabledProviders?.[options.applicationId] ?? application.providers;
  validateProviderSelection(profile.id, options.applicationId, enabledProviderIds, options.availableProviderIds);
  return { id: `${profile.id}:${options.applicationId}`, enabledProviderIds };
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
    if (existsSync(resolve(directory, "registry"))) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error("Could not find the CODEXSUN registry root.");
    directory = parent;
  }
}

function validateProviderSelection(profileId: string, applicationId: string, selected: readonly string[], available: readonly string[]): void {
  if (!selected.length) throw new Error(`Deployment profile ${profileId} enables no providers for ${applicationId}.`);
  const availableIds = new Set(available);
  for (const providerId of selected) {
    if (!availableIds.has(providerId)) {
      throw new Error(`Deployment profile ${profileId} enables unavailable provider ${providerId} for ${applicationId}.`);
    }
  }
}

function readJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    throw new Error(`Could not read deployment registry file ${path}: ${(error as Error).message}`);
  }
}
