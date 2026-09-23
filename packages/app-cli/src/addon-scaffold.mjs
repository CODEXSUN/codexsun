import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadRegistry } from "./registry.mjs";

export function createAddon(rootDir, options) {
  const registry = loadRegistry(rootDir);
  const id = String(options.id ?? "").trim();
  if (!/^[a-z][a-z0-9-]*$/u.test(id)) throw new Error("Add-on ID must use lowercase kebab case.");
  if (registry.addons.some((addon) => addon.id === id)) throw new Error(`Add-on already exists: ${id}.`);
  const packagePath = resolve(registry.root, "packages", id);
  if (existsSync(packagePath)) throw new Error(`Add-on package already exists: packages/${id}.`);

  const label = String(options.label ?? titleCase(id)).trim();
  const providerId = `${id}.provider`;
  const addon = {
    schemaVersion: 1,
    kind: "addon",
    id,
    label,
    owner: `packages/${id}`,
    package: `@codexsun/${id}`,
    providerId,
    dependencies: [],
    dataRetention: "retain",
    dataLifecycle: { compatibility: "backward-compatible", migrations: [], seeders: [] },
  };
  writeJson(resolve(registry.registry, "addons", `${id}.json`), addon);
  writeJson(resolve(packagePath, "package.json"), packageJson(addon, workspaceVersion(registry.root)));
  write(resolve(packagePath, "tsconfig.json"), '{ "extends": "../../tsconfig.base.json", "include": ["src", "test"] }\n');
  write(resolve(packagePath, "README.md"), `# ${label} Add-on\n\nThis add-on publishes one provider. Applications select it through a deployment profile.\n`);
  write(resolve(packagePath, "src", "index.ts"), providerSource(addon));
  write(resolve(packagePath, "test", "provider.test.ts"), testSource(addon));
  return addon;
}

function packageJson(addon, version) {
  return { name: addon.package, version, private: true, type: "module", exports: { ".": "./src/index.ts" }, scripts: { check: "tsc --noEmit -p tsconfig.json", test: "tsx --test test/provider.test.ts" }, dependencies: { "@codexsun/framework": "file:../framework" } };
}

function providerSource(addon) {
  const name = className(addon.id);
  return `import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";\n\nexport class ${name}Provider implements ModuleProvider {\n  readonly manifest = { id: "${addon.providerId}", owner: "packages/${addon.id}", version: "1.0.0", dependencies: [], contracts: ["${addon.id}"], events: { published: [], consumed: [] } };\n  register(_context: ProviderRegistrationContext): void {}\n}\n\nexport function createAddonProvider(): ModuleProvider {\n  return new ${name}Provider();\n}\n`;
}

function testSource(addon) {
  const name = className(addon.id);
  return `import assert from "node:assert/strict";\nimport test from "node:test";\nimport { ${name}Provider } from "../src/index.js";\n\ntest("declares the ${addon.id} add-on provider", () => assert.equal(new ${name}Provider().manifest.id, "${addon.providerId}"));\n`;
}

function write(path, content) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function writeJson(path, value) {
  write(path, `${JSON.stringify(value, null, 2)}\n`);
}

function className(id) {
  return id.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join("");
}

function titleCase(id) {
  return id.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

function workspaceVersion(root) {
  const path = resolve(root, "package.json");
  return JSON.parse(readFileSync(path, "utf8")).version;
}
