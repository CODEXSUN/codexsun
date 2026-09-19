import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { getRuntimeTargets, getScopeWorkspaces, updateProfile, verifyRegistry } from "../src/registry.mjs";
import { createApplication } from "../src/app-scaffold.mjs";
import { removeApplication } from "../src/app-uninstall.mjs";
import { createAddon } from "../src/addon-scaffold.mjs";

function createFixture() {
  const root = mkdtempSync(resolve(tmpdir(), "codexsun-registry-"));
  mkdirSync(resolve(root, "registry", "applications"), { recursive: true });
  mkdirSync(resolve(root, "registry", "addons"), { recursive: true });
  mkdirSync(resolve(root, "registry", "profiles"), { recursive: true });
  writeFileSync(resolve(root, "package.json"), JSON.stringify({ name: "fixture", version: "9.8.7", scripts: {} }));
  writeFileSync(resolve(root, "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: {} }));
  writeFileSync(resolve(root, "turbo.json"), JSON.stringify({ tasks: {} }));
  mkdirSync(resolve(root, "apps", "sample", "web"), { recursive: true });
  writeFileSync(resolve(root, "apps", "sample", "web", "package.json"), JSON.stringify({ name: "@codexsun/sample-web" }));
  writeFileSync(resolve(root, "registry", "applications", "sample.json"), JSON.stringify({ schemaVersion: 1, kind: "application", id: "sample", label: "Sample", owner: "apps/sample", taskPrefix: "s", providers: [], hosts: [{ kind: "web", target: "sample-web", displayName: "Sample web", environmentDirectory: "web", envKey: "SAMPLE_PORT", workspace: "@codexsun/sample-web" }] }));
  writeFileSync(resolve(root, "registry", "addons", "sample-addon.json"), JSON.stringify({ schemaVersion: 1, kind: "addon", id: "sample-addon", label: "Sample addon", owner: "packages/sample-addon", package: "@codexsun/sample-addon", providerId: "sample-addon.provider", dependencies: [], dataRetention: "retain", dataLifecycle: { compatibility: "backward-compatible", migrations: [], seeders: [] } }));
  writeFileSync(resolve(root, "registry", "profiles", "development.json"), JSON.stringify({ schemaVersion: 1, id: "development", enabledApplications: ["sample"], enabledAddons: [] }));
  return root;
}

test("loads application build scopes and runtime targets from manifests", () => {
  const root = createFixture();
  assert.deepEqual(getScopeWorkspaces(root).sample, ["@codexsun/sample-web"]);
  assert.equal(getRuntimeTargets(root)["sample-web"].envKey, "SAMPLE_PORT");
  assert.deepEqual(verifyRegistry(root).applications, ["sample"]);
});

test("updates a profile without deleting application or add-on files", () => {
  const root = createFixture();
  const profile = updateProfile(root, "development", "addon", "sample-addon", true);
  assert.deepEqual(profile.enabledAddons, ["sample-addon"]);
});

test("rejects unsafe profile paths and duplicate runtime targets", () => {
  const root = createFixture();
  assert.throws(() => updateProfile(root, "../outside", "application", "sample", true), /Profile id/u);
  writeFileSync(resolve(root, "registry", "applications", "duplicate.json"), JSON.stringify({ schemaVersion: 1, kind: "application", id: "duplicate", label: "Duplicate", owner: "apps/duplicate", taskPrefix: "d", providers: [], hosts: [{ kind: "web", target: "sample-web", displayName: "Duplicate web", environmentDirectory: "web", envKey: "DUPLICATE_PORT", workspace: "@codexsun/duplicate-web" }] }));
  assert.throws(() => getRuntimeTargets(root), /Duplicate runtime target/u);
});

test("creates an API and web foundation that is ready for a new application", () => {
  const root = createFixture();
  mkdirSync(resolve(root, "packages", "ui", "src", "layouts", "mdi-main"), { recursive: true });
  const application = createApplication(root, { apiPort: 6200, id: "inventory", label: "Inventory", taskPrefix: "i", webPort: 6201 });

  assert.equal(application.id, "inventory");
  assert.equal(existsSync(resolve(root, "apps", "inventory", "api", "src", "server.ts")), true);
  assert.equal(existsSync(resolve(root, "apps", "inventory", "api", "node_modules")), false);
  assert.equal(existsSync(resolve(root, "apps", "inventory", "web", "node_modules")), false);
  assert.match(readFileSync(resolve(root, "apps", "inventory", "agent", "skills.md"), "utf8"), /repository root only/u);
  assert.equal(existsSync(resolve(root, "apps", "inventory", "agent", "exec", "inventory-task.md")), true);
  const webSource = readFileSync(resolve(root, "apps", "inventory", "web", "src", "app.tsx"), "utf8");
  assert.match(webSource, /label: "Overview"/u);
  assert.match(webSource, /Inventory overview/u);
  const serverSource = readFileSync(resolve(root, "apps", "inventory", "api", "src", "server.ts"), "utf8");
  assert.match(serverSource, /swaggerUi/u);
  assert.match(serverSource, /loadEnabledAddonProviders/u);
  assert.match(serverSource, /app\.register\(helmet\)/u);
  assert.equal(existsSync(resolve(root, "apps", "inventory", "api", "src", "mariadb.integration.test.ts")), true);
  assert.match(readFileSync(resolve(root, "apps", "inventory", "api", "src", "modules", "foundation", "provider.ts"), "utf8"), /published: \[\], consumed: \[\]/u);
  assert.match(readFileSync(resolve(root, "packages", "ui", "src", "layouts", "mdi-main", "mdi-app-catalog.generated.ts"), "utf8"), /inventory/u);
  assert.ok(verifyRegistry(root).applications.includes("inventory"));
  assert.equal(JSON.parse(readFileSync(resolve(root, "apps", "inventory", "api", "package.json"), "utf8")).version, "9.8.7");
  assert.equal(JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts["dev:inventory-api"], "node tools/preflight.mjs inventory-api --restart");
  assert.match(readFileSync(resolve(root, "apps", "inventory", "web", "vite.config.ts"), "utf8"), /cacheDir: "\.\.\/\.\.\/\.\.\/dist\/\.vite\/apps\/inventory\/web"/u);
  assert.ok(JSON.parse(readFileSync(resolve(root, "turbo.json"), "utf8")).tasks["@codexsun/inventory-web#build"]);
  assert.ok(JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8")).packages["apps/inventory/api"]);
});

test("removes only one generated application and its registry bindings", () => {
  const root = createFixture();
  mkdirSync(resolve(root, "packages", "ui", "src", "layouts", "mdi-main"), { recursive: true });
  const application = createApplication(root, { apiPort: 6200, id: "inventory", label: "Inventory", taskPrefix: "i", webPort: 6201 });

  assert.deepEqual(removeApplication(root, application.id), { id: "inventory", removed: true });
  assert.equal(existsSync(resolve(root, "apps", "inventory")), false);
  assert.equal(existsSync(resolve(root, "registry", "applications", "inventory.json")), false);
  assert.equal(verifyRegistry(root).applications.includes("inventory"), false);
  assert.equal(JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8")).packages["apps/inventory/api"], undefined);
  assert.equal(JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts["dev:inventory-api"], undefined);
  assert.equal(JSON.parse(readFileSync(resolve(root, "turbo.json"), "utf8")).tasks["@codexsun/inventory-web#build"], undefined);
});

test("creates an add-on with lifecycle metadata and a provider test", () => {
  const root = createFixture();
  const addon = createAddon(root, { id: "catalog", label: "Catalog" });

  assert.equal(addon.providerId, "catalog.provider");
  assert.equal(JSON.parse(readFileSync(resolve(root, "packages", "catalog", "package.json"), "utf8")).version, "9.8.7");
  assert.match(readFileSync(resolve(root, "packages", "catalog", "src", "index.ts"), "utf8"), /createAddonProvider/u);
  assert.equal(existsSync(resolve(root, "packages", "catalog", "test", "provider.test.ts")), true);
  assert.ok(verifyRegistry(root).addons.includes("catalog"));
});
