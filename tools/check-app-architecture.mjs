#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sourceExtensions = new Set([".ts", ".tsx"]);

export const applicationProfiles = {
  platform: { hosts: ["api", "web", "desktop", "mobile"] },
  docs: { hosts: ["api", "web"] },
  orship: { hosts: ["api", "web"] },
  zetro: { hosts: ["api", "web"] },
  uiux: { hosts: ["web"], role: "visual-catalog" },
};

export function checkAppArchitecture(rootDir) {
  const root = resolve(rootDir);
  const violations = Object.entries(applicationProfiles).flatMap(([app, profile]) =>
    checkApplication(root, app, profile),
  );

  if (violations.length) throw new Error(`Application architecture violations:\n${violations.join("\n")}`);
  return Object.keys(applicationProfiles);
}

function checkApplication(root, app, profile) {
  const appPath = resolve(root, "apps", app);
  const violations = [];
  if (!existsSync(resolve(appPath, "README.md"))) violations.push(`apps/${app}: missing application README.md`);

  for (const host of profile.hosts) {
    const hostPath = resolve(appPath, host);
    if (!existsSync(hostPath)) {
      violations.push(`apps/${app}: missing declared ${host} host`);
      continue;
    }
    violations.push(...checkHost(root, app, host, hostPath));
  }

  return violations;
}

function checkHost(root, app, host, hostPath) {
  const label = `apps/${app}/${host}`;
  const required = ["README.md", "package.json", "tsconfig.json"];
  if (["api", "web", "desktop", "mobile"].includes(host)) required.push(".app.env.example");
  const violations = required.filter((file) => !existsSync(resolve(hostPath, file))).map((file) => `${label}: missing ${file}`);

  if (host === "api") violations.push(...checkApiHost(root, app, hostPath));
  if (["web", "desktop", "mobile"].includes(host)) violations.push(...checkClientHost(root, app, host, hostPath));
  return violations;
}

function checkApiHost(root, app, hostPath) {
  const label = `apps/${app}/api`;
  const violations = ["src/config.ts", "src/server.ts", "src/modules"].filter((file) => !existsSync(resolve(hostPath, file))).map(
    (file) => `${label}: missing ${file}`,
  );
  const dependencies = packageDependencies(hostPath);

  for (const dependency of ["@codexsun/framework", "@codexsun/platform-core"]) {
    if (!dependencies.has(dependency)) violations.push(`${label}: missing shared ${dependency} dependency`);
  }
  if (existsSync(resolve(hostPath, "src/modules"))) violations.push(...checkModules(root, app, "api", hostPath));
  return violations;
}

function checkClientHost(root, app, host, hostPath) {
  const label = `apps/${app}/${host}`;
  const violations = ["src/app.tsx", "src/main.tsx"].filter((file) => !existsSync(resolve(hostPath, file))).map(
    (file) => `${label}: missing ${file}`,
  );

  if (host === "web" && !packageDependencies(hostPath).has("@codexsun/ui")) {
    violations.push(`${label}: missing shared @codexsun/ui dependency`);
  }
  if (host === "web" && !readSourceFiles(resolve(hostPath, "src")).some((file) => reads(file).includes('"@codexsun/ui"'))) {
    violations.push(`${label}: does not compose public @codexsun/ui exports`);
  }
  if (existsSync(resolve(hostPath, "src/modules"))) violations.push(...checkModules(root, app, host, hostPath));
  return violations;
}

function checkModules(root, app, host, hostPath) {
  const modulesPath = resolve(hostPath, "src/modules");
  return readdirSync(modulesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => checkModule(root, app, host, resolve(modulesPath, entry.name)));
}

function checkModule(root, app, host, modulePath) {
  const module = modulePath.split(/[\\/]/u).at(-1);
  const label = `apps/${app}/${host}/src/modules/${module}`;
  const provider = ["provider.ts", "provider.tsx"].map((file) => resolve(modulePath, file)).find(existsSync);
  const violations = [];

  if (!provider) violations.push(`${label}: missing module provider`);
  if (!existsSync(resolve(modulePath, "README.md"))) violations.push(`${label}: missing module README.md`);
  if (!hasTests(resolve(modulePath, "test"))) violations.push(`${label}: missing module test suite`);
  if (provider) {
    const source = reads(provider);
    const owner = `apps/${app}/${host}/modules/${module}`;
    if (!source.includes(`owner: "${owner}"`)) violations.push(`${label}: provider owner must be ${owner}`);
    if (!/events:\s*\{\s*published:\s*\[[\s\S]*?\],\s*consumed:\s*\[/u.test(source)) {
      violations.push(`${label}: provider must declare published and consumed events`);
    }
  }

  if (existsSync(resolve(modulePath, "repository")) && !existsSync(resolve(modulePath, "service"))) {
    violations.push(`${label}: repository layer requires an owner service layer`);
  }
  return [...violations, ...checkPrivateAppImports(root, app, modulePath)];
}

function checkPrivateAppImports(root, app, directory) {
  return readSourceFiles(directory).flatMap((file) =>
    readImports(file).flatMap((specifier) => {
      if (specifier.includes("/packages/") || specifier.startsWith("packages/")) {
        return [`${relative(root, file)}: imports a package source path instead of a public package export`];
      }
      if (!specifier.startsWith(".")) return [];
      const target = resolve(dirname(file), specifier);
      const targetPath = relative(root, target).replaceAll("\\", "/");
      return targetPath.startsWith("apps/") && !targetPath.startsWith(`apps/${app}/`)
        ? [`${relative(root, file)}: imports another app private path ${specifier}`]
        : [];
    }),
  );
}

function packageDependencies(hostPath) {
  if (!existsSync(resolve(hostPath, "package.json"))) return new Set();
  const packageJson = JSON.parse(reads(resolve(hostPath, "package.json")));
  return new Set(Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }));
}

function readSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return readSourceFiles(path);
    return sourceExtensions.has(path.slice(path.lastIndexOf("."))) ? [path] : [];
  });
}

function hasTests(directory) {
  return readSourceFiles(directory).some((file) => file.endsWith(".test.ts") || file.endsWith(".test.tsx"));
}

function readImports(file) {
  return [...reads(file).matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/gu)].map((match) => match[1]);
}

function reads(path) {
  return readFileSync(path, "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const applications = checkAppArchitecture(process.cwd());
  console.log(`Application architecture is valid for ${applications.join(", ")}.`);
}
