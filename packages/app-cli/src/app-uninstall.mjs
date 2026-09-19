import { existsSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { loadRegistry } from "./registry.mjs";
import { syncMdiCatalog } from "./mdi-catalog.mjs";

export function removeApplication(rootDir, applicationId) {
  const registry = loadRegistry(rootDir);
  const application = registry.applications.find((item) => item.id === applicationId);
  if (!application) throw new Error(`Unknown application: ${applicationId}.`);

  const applicationPath = resolve(registry.root, "apps", application.id);
  assertApplicationPath(registry.root, applicationPath, application.id);
  assertNotRunning(registry.root, application);
  removeProfileBindings(registry.root, application.id);
  removeWorkspaceLock(registry.root, application);
  removeRootScripts(registry.root, application);
  removeTurboOutputs(registry.root, application);
  removeRootMdiPort(registry.root, application.mdi?.localUrlKey);
  unlinkSync(resolve(registry.root, "registry", "applications", `${application.id}.json`));
  rmSync(applicationPath, { force: true, recursive: true });
  syncMdiCatalog(registry.root);
  return { id: application.id, removed: true };
}

function assertApplicationPath(root, applicationPath, applicationId) {
  const appsPath = resolve(root, "apps");
  if (relative(appsPath, applicationPath) !== applicationId || resolve(appsPath, applicationId) !== applicationPath) {
    throw new Error("Application path is outside apps.");
  }
}

function assertNotRunning(root, application) {
  for (const host of application.hosts) {
    const port = host.defaultPort;
    if (Number.isInteger(port) && existsSync(resolve(root, "storage", "runtime", "ports", `${port}.lock`))) {
      throw new Error(`Stop ${host.target} before removing ${application.id}.`);
    }
  }
}

function removeProfileBindings(root, applicationId) {
  const profilesPath = resolve(root, "registry", "profiles");
  for (const entry of readdirSync(profilesPath, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const path = resolve(profilesPath, entry.name);
    const profile = JSON.parse(readFileSync(path, "utf8"));
    profile.enabledApplications = (profile.enabledApplications ?? []).filter((id) => id !== applicationId);
    if (profile.enabledProviders) delete profile.enabledProviders[applicationId];
    writeJson(path, profile);
  }
}

function removeWorkspaceLock(root, application) {
  const path = resolve(root, "package-lock.json");
  if (!existsSync(path)) return;
  const lock = JSON.parse(readFileSync(path, "utf8"));
  for (const host of application.hosts) {
    delete lock.packages?.[`apps/${application.id}/${host.environmentDirectory}`];
    delete lock.packages?.[`node_modules/${host.workspace}`];
  }
  writeJson(path, lock);
}

function removeRootMdiPort(root, key) {
  const path = resolve(root, ".env");
  if (!key || !existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  writeFileSync(path, content.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`, "mu"), ""), "utf8");
}

function removeRootScripts(root, application) {
  const path = resolve(root, "package.json");
  if (!existsSync(path)) return;
  const packageJson = JSON.parse(readFileSync(path, "utf8"));
  const scripts = packageJson.scripts ?? {};
  for (const host of application.hosts) {
    const key = `dev:${application.id}-${host.kind}`;
    if (scripts[key] === `node tools/preflight.mjs ${host.target} --restart`) delete scripts[key];
  }
  const testKey = `test:${application.id}`;
  const testValue = application.hosts.map((host) => `npm run test --workspace ${host.workspace}`).join(" && ");
  if (scripts[testKey] === testValue) delete scripts[testKey];
  packageJson.scripts = scripts;
  writeJson(path, packageJson);
}

function removeTurboOutputs(root, application) {
  const path = resolve(root, "turbo.json");
  if (!existsSync(path)) return;
  const turbo = JSON.parse(readFileSync(path, "utf8"));
  delete turbo.tasks?.[`@codexsun/${application.id}-api#build`];
  delete turbo.tasks?.[`@codexsun/${application.id}-web#build`];
  writeJson(path, turbo);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
