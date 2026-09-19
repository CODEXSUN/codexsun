import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const idPattern = /^[a-z][a-z0-9-]*$/u;
const hostKinds = new Set(["api", "web", "desktop", "mobile"]);
const packageWorkspaces = [
  "@codexsun/contracts",
  "@codexsun/docs-contracts",
  "@codexsun/framework",
  "@codexsun/platform-core",
  "@codexsun/ui",
  "@codexsun/zetro-contracts",
];

export function loadRegistry(rootDir = resolve(import.meta.dirname, "../../..")) {
  const root = resolve(rootDir);
  const applications = readManifests(root, "applications", "application");
  const addons = readManifests(root, "addons", "addon");
  verifyUniqueTargets(applications);
  return { addons, applications, root };
}

export function verifyRegistry(rootDir) {
  const registry = loadRegistry(rootDir);
  const applicationIds = new Set(registry.applications.map((application) => application.id));
  const addonIds = new Set(registry.addons.map((addon) => addon.id));
  const profiles = readProfiles(registry.root);

  verifyApplicationBindings(registry.root, registry.applications);
  for (const profile of profiles) {
    verifyProfile(profile, applicationIds, addonIds);
  }
  return { applications: registry.applications.map((item) => item.id), addons: registry.addons.map((item) => item.id), profiles: profiles.map((item) => item.id) };
}

export function getScopeWorkspaces(rootDir) {
  const { applications } = loadRegistry(rootDir);
  return Object.fromEntries([
    ...applications.map((application) => [application.id, application.hosts.map((host) => host.workspace)]),
    ["packages", packageWorkspaces],
  ]);
}

export function getRuntimeTargets(rootDir) {
  return Object.fromEntries(
    loadRegistry(rootDir).applications.flatMap((application) =>
      application.hosts.map((host) => [
        host.target,
        {
          application: application.id,
          displayName: host.displayName,
          environmentDirectory: host.environmentDirectory,
          envKey: host.envKey,
          hostKey: host.hostKey,
          workspace: host.workspace,
        },
      ]),
    ),
  );
}

export function getApplicationProfiles(rootDir) {
  return Object.fromEntries(
    loadRegistry(rootDir).applications.map((application) => [
      application.id,
      { hosts: application.hosts.map((host) => host.kind), ...(application.role ? { role: application.role } : {}) },
    ]),
  );
}

export function getApplication(rootDir, id) {
  const application = loadRegistry(rootDir).applications.find((item) => item.id === id);
  if (!application) throw new Error(`Unknown application: ${id}.`);
  return application;
}

export function updateProfile(rootDir, profileId, kind, id, enabled) {
  if (!idPattern.test(profileId ?? "")) throw new Error("Profile id must be lowercase kebab-case.");
  if (!new Set(["application", "addon"]).has(kind)) throw new Error(`Unknown registry kind: ${kind}.`);
  const registry = loadRegistry(rootDir);
  const collection = kind === "application" ? registry.applications : registry.addons;
  if (!collection.some((item) => item.id === id)) throw new Error(`Unknown ${kind}: ${id}.`);

  const profilePath = resolve(registry.root, "registry", "profiles", `${profileId}.json`);
  if (!existsSync(profilePath)) throw new Error(`Unknown profile: ${profileId}.`);
  const profile = readJson(profilePath);
  const key = kind === "application" ? "enabledApplications" : "enabledAddons";
  const current = new Set(profile[key] ?? []);
  if (enabled) current.add(id);
  else current.delete(id);
  profile[key] = [...current].sort();
  if (kind === "application" && !enabled && profile.enabledProviders) delete profile.enabledProviders[id];
  writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  return profile;
}

function readManifests(root, category, expectedKind) {
  const directory = resolve(root, "registry", category);
  if (!existsSync(directory)) return [];
  const ids = new Set();
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => validateManifest(readJson(resolve(directory, entry.name)), expectedKind, entry.name, ids));
}

function validateManifest(manifest, expectedKind, filename, ids) {
  if (manifest.kind !== expectedKind) throw new Error(`${filename}: expected kind ${expectedKind}.`);
  if (!idPattern.test(manifest.id ?? "")) throw new Error(`${filename}: id must be lowercase kebab-case.`);
  if (ids.has(manifest.id)) throw new Error(`${filename}: duplicate ${expectedKind} id ${manifest.id}.`);
  ids.add(manifest.id);
  if (expectedKind === "application") validateApplication(manifest, filename);
  else validateAddon(manifest, filename);
  return manifest;
}

function validateApplication(application, filename) {
  if (application.schemaVersion !== 1) throw new Error(`${filename}: schemaVersion must be 1.`);
  if (typeof application.label !== "string" || !application.label.trim()) throw new Error(`${filename}: label is required.`);
  if (typeof application.taskPrefix !== "string" || !/^[a-z]$/u.test(application.taskPrefix)) {
    throw new Error(`${filename}: taskPrefix must be one lowercase letter.`);
  }
  if (!Array.isArray(application.providers) || new Set(application.providers).size !== application.providers.length) {
    throw new Error(`${filename}: providers must be a unique array.`);
  }
  if (application.mdi !== undefined) {
    for (const field of ["icon", "localUrlKey", "path"]) {
      if (typeof application.mdi[field] !== "string" || !application.mdi[field].trim()) {
        throw new Error(`${filename}: mdi ${field} is required.`);
      }
    }
  }
  if (!Array.isArray(application.hosts) || application.hosts.length === 0) throw new Error(`${filename}: application requires hosts.`);
  const targets = new Set();
  for (const host of application.hosts) {
    if (!hostKinds.has(host.kind)) throw new Error(`${filename}: invalid host kind ${host.kind}.`);
    for (const field of ["target", "displayName", "environmentDirectory", "envKey", "workspace"]) {
      if (typeof host[field] !== "string" || !host[field].trim()) throw new Error(`${filename}: host ${field} is required.`);
    }
    if (targets.has(host.target)) throw new Error(`${filename}: duplicate target ${host.target}.`);
    targets.add(host.target);
  }
}

function validateAddon(addon, filename) {
  if (addon.schemaVersion !== 1) throw new Error(`${filename}: schemaVersion must be 1.`);
  if (typeof addon.label !== "string" || !addon.label.trim()) throw new Error(`${filename}: label is required.`);
  if (typeof addon.package !== "string" || !addon.package.startsWith("@codexsun/")) {
    throw new Error(`${filename}: add-on package must use the @codexsun scope.`);
  }
  if (typeof addon.providerId !== "string" || !addon.providerId.includes(".")) {
    throw new Error(`${filename}: providerId is required.`);
  }
  if (!Array.isArray(addon.dependencies) || new Set(addon.dependencies).size !== addon.dependencies.length) {
    throw new Error(`${filename}: dependencies must be a unique array.`);
  }
  if (addon.dataRetention !== "retain") throw new Error(`${filename}: add-on dataRetention must be retain.`);
  if (!addon.dataLifecycle || addon.dataLifecycle.compatibility !== "backward-compatible" || !Array.isArray(addon.dataLifecycle.migrations) || !Array.isArray(addon.dataLifecycle.seeders)) {
    throw new Error(`${filename}: dataLifecycle must declare backward-compatible migrations and seeders.`);
  }
}

function verifyUniqueTargets(applications) {
  const targets = new Set();
  for (const application of applications) {
    for (const host of application.hosts) {
      if (targets.has(host.target)) throw new Error(`Duplicate runtime target: ${host.target}.`);
      targets.add(host.target);
    }
  }
}

function verifyApplicationBindings(root, applications) {
  for (const application of applications) {
    const applicationPath = resolve(root, "apps", application.id);
    if (!existsSync(applicationPath)) throw new Error(`Application ${application.id}: apps/${application.id} is missing.`);
    for (const host of application.hosts) verifyHostBinding(application, host, applicationPath);
  }
}

function verifyHostBinding(application, host, applicationPath) {
  const hostPath = resolve(applicationPath, host.environmentDirectory);
  const packagePath = resolve(hostPath, "package.json");
  if (!existsSync(hostPath) || !existsSync(packagePath)) {
    throw new Error(`Application ${application.id}: declared host ${host.environmentDirectory} is missing.`);
  }
  if (readJson(packagePath).name !== host.workspace) {
    throw new Error(`Application ${application.id}: ${host.environmentDirectory} workspace must be ${host.workspace}.`);
  }
}

function readProfiles(root) {
  const directory = resolve(root, "registry", "profiles");
  if (!existsSync(directory)) throw new Error("registry/profiles is missing.");
  const ids = new Set();
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => {
      const profile = readJson(resolve(directory, entry.name));
      if (ids.has(profile.id)) throw new Error(`Duplicate profile id: ${profile.id}.`);
      ids.add(profile.id);
      return profile;
    });
}

function verifyProfile(profile, applicationIds, addonIds) {
  if (profile.schemaVersion !== 1) throw new Error(`Profile ${profile.id}: schemaVersion must be 1.`);
  if (!idPattern.test(profile.id ?? "")) throw new Error("Profile id must be lowercase kebab-case.");
  for (const [key, knownIds] of [["enabledApplications", applicationIds], ["enabledAddons", addonIds]]) {
    if (!Array.isArray(profile[key])) throw new Error(`Profile ${profile.id}: ${key} must be an array.`);
    for (const id of profile[key]) if (!knownIds.has(id)) throw new Error(`Profile ${profile.id}: unknown registry entry ${id}.`);
  }
  if (profile.enabledProviders !== undefined && (typeof profile.enabledProviders !== "object" || Array.isArray(profile.enabledProviders))) {
    throw new Error(`Profile ${profile.id}: enabledProviders must be an object.`);
  }
  for (const [applicationId, providers] of Object.entries(profile.enabledProviders ?? {})) {
    if (!applicationIds.has(applicationId)) throw new Error(`Profile ${profile.id}: enabledProviders has unknown application ${applicationId}.`);
    if (!profile.enabledApplications.includes(applicationId)) {
      throw new Error(`Profile ${profile.id}: enabledProviders includes disabled application ${applicationId}.`);
    }
    if (!Array.isArray(providers) || new Set(providers).size !== providers.length) {
      throw new Error(`Profile ${profile.id}: enabledProviders for ${applicationId} must be a unique array.`);
    }
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${path}: ${error.message}`);
  }
}
