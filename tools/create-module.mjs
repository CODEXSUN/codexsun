#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const artifactFolders = [
  "contracts",
  "controller",
  "domain",
  "events",
  "migrations",
  "repository",
  "routes",
  "seeders",
  "services",
];

export function createModule({ rootDir, target, moduleName, moduleId, owner }) {
  validateModuleInput({ target, moduleName, moduleId, owner });
  const root = resolve(rootDir);
  const modulePath = resolve(root, target, moduleName);
  assertWithinRoot(root, modulePath);
  if (existsSync(modulePath)) throw new Error(`Module already exists: ${relative(root, modulePath)}`);

  mkdirSync(modulePath, { recursive: true });
  writeFile(modulePath, "provider.ts", providerSource(moduleName, moduleId, owner));
  writeFile(modulePath, "README.md", readmeSource(moduleName, moduleId, owner));
  writeFile(modulePath, "test/provider.test.ts", testSource(moduleName));
  writeFile(modulePath, "test/README.md", testReadmeSource());
  for (const folder of artifactFolders) writeFile(modulePath, `${folder}/.gitkeep`, "");
  return modulePath;
}

function validateModuleInput({ target, moduleName, moduleId, owner }) {
  if (!/^[a-z][a-z0-9-]*$/u.test(moduleName)) throw new Error("Module name must use lowercase kebab case.");
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/u.test(moduleId)) {
    throw new Error("Module ID must contain lowercase dot-separated segments.");
  }
  if (!/^((apps|packages)\/)[a-z0-9-]+(?:\/[a-z0-9-]+)*$/u.test(owner)) {
    throw new Error("Owner must be a relative apps or packages path.");
  }
  if (!/^((apps|packages)\/)[a-z0-9-]+(?:\/[a-z0-9-]+)*$/u.test(target)) {
    throw new Error("Target must be a relative apps or packages path.");
  }
}

function assertWithinRoot(root, path) {
  const pathFromRoot = relative(root, path);
  if (pathFromRoot.startsWith("..") || pathFromRoot === "")
    throw new Error("Module target must stay within the workspace.");
}

function writeFile(modulePath, file, content) {
  const path = resolve(modulePath, file);
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function providerSource(moduleName, moduleId, owner) {
  const className = `${moduleName.split("-").map(capitalize).join("")}ModuleProvider`;
  return `import { type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";\n\nexport class ${className} implements ModuleProvider {\n  readonly manifest = {\n    id: "${moduleId}",\n    owner: "${owner}/modules/${moduleName}",\n    version: "0.1.0",\n    dependencies: [],\n    contracts: [],\n  };\n\n  register(_context: ProviderRegistrationContext): void {}\n}\n`;
}

function readmeSource(moduleName, moduleId, owner) {
  return `# ${moduleName} Module\n\nModule ID: \`${moduleId}\`\n\nOwner: \`${owner}/modules/${moduleName}\`\n\n## Purpose\n\nState the module business capability.\n\n## Provider\n\nAdd dependencies, public contracts, routes, and event subscriptions.\n\n## Data And Storage\n\nRecord tables, migrations, seeders, storage, retention, and tenant behavior.\n\n## Clients And Tests\n\nList supported clients and focused checks.\n`;
}

function testSource(moduleName) {
  return `import test from "node:test";\n\ntest("${moduleName} module provider placeholder", () => {});\n`;
}

function testReadmeSource() {
  return `# Module Test Conventions\n\nKeep each test in this module folder.\n\n- Test public contracts with valid and invalid data.\n- Test services through use cases.\n- Test repositories with an isolated provider.\n- Test routes with Fastify inject.\n- Test events for payload and idempotent consumer behavior.\n- Test migrations and seeders when this module owns data.\n`;
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const modulePath = createModule({
    rootDir: process.cwd(),
    target: option("--target") ?? "",
    moduleName: option("--name") ?? "",
    moduleId: option("--id") ?? "",
    owner: option("--owner") ?? "",
  });
  console.log(`Created module template: ${relative(process.cwd(), modulePath)}`);
}
