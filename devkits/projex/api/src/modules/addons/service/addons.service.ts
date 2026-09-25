import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { AddonCatalogSnapshot } from "../contracts/addons.contract.js";

type AddonManifest = {
  areas?: string[];
  contracts?: string[];
  dataLifecycle: { compatibility: string; migrations: string[]; seeders: string[] };
  dataRetention: string;
  dependencies: string[];
  events?: string[];
  id: string;
  label: string;
  owner: string;
  package: string;
  providerId: string;
  purpose?: string;
};

type DeploymentProfile = { enabledAddons?: string[] };

export function readAddonCatalog(startDirectory = process.cwd()): AddonCatalogSnapshot {
  const root = findRepositoryRoot(startDirectory);
  const manifests = readdirSync(join(root, "core", "registry", "addons"))
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(root, "core", "registry", "addons", file), "utf8")) as AddonManifest)
    .sort((left, right) => left.label.localeCompare(right.label));
  const profile = readDeploymentProfile(root);
  const enabled = new Set(profile.enabledAddons ?? manifests.map((manifest) => manifest.id));
  const addons = manifests.map((manifest) => ({
    areas: manifest.areas ?? [],
    contracts: manifest.contracts ?? [],
    dataLifecycle: manifest.dataLifecycle,
    dataRetention: manifest.dataRetention,
    dependencies: manifest.dependencies,
    events: manifest.events ?? [],
    id: manifest.id,
    label: manifest.label,
    owner: manifest.owner,
    package: manifest.package,
    providerId: manifest.providerId,
    purpose: manifest.purpose ?? "Registered business capability.",
    enabled: enabled.has(manifest.id),
  }));
  return {
    addons,
    generatedAt: new Date().toISOString(),
    summary: {
      addonCount: addons.length,
      enabledCount: addons.filter((addon) => addon.enabled).length,
      dependencyCount: new Set(addons.flatMap((addon) => addon.dependencies)).size,
    },
  };
}

function readDeploymentProfile(root: string): DeploymentProfile {
  const profileId = process.env.CODEXSUN_DEPLOYMENT_PROFILE ?? "development";
  const path = join(root, "core", "registry", "profiles", `${profileId}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as DeploymentProfile : {};
}

function findRepositoryRoot(startDirectory: string): string {
  let current = resolve(startDirectory);
  while (dirname(current) !== current) {
    if (existsSync(join(current, "core", "registry", "addons"))) return current;
    current = dirname(current);
  }
  throw new Error("Could not locate the repository add-on registry.");
}
