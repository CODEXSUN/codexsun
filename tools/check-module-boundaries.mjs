#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sourceExtensions = new Set([".js", ".mjs", ".ts", ".tsx"]);

export function checkModuleBoundaries(rootDir) {
  const root = resolve(rootDir);
  const modules = findModules(root);
  const violations = modules.flatMap((module) => checkModule(root, module, modules));
  if (violations.length) throw new Error(`Module boundary violations:\n${violations.join("\n")}`);
  return modules.map((module) => relative(root, module).replaceAll("\\", "/"));
}

function findModules(root) {
  return findDirectories(root, (path) => path.endsWith("/src/modules") || path.endsWith("\\src\\modules")).flatMap(
    (modulesPath) =>
      readdirSync(modulesPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => resolve(modulesPath, entry.name)),
  );
}

function findDirectories(directory, matches) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory() || [".git", "dist", "node_modules", "storage"].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return matches(path) ? [path] : findDirectories(path, matches);
  });
}

function checkModule(root, modulePath, modules) {
  const expectedOwner = moduleOwner(root, modulePath);
  const provider = ["provider.ts", "provider.tsx"].map((file) => resolve(modulePath, file)).find(existsSync);
  const violations = [];
  if (!provider) violations.push(`${relative(root, modulePath)}: missing root provider`);
  if (!existsSync(resolve(modulePath, "README.md")))
    violations.push(`${relative(root, modulePath)}: missing README.md`);
  if (provider && !readFileSync(provider, "utf8").includes(`owner: "${expectedOwner}"`)) {
    violations.push(`${relative(root, provider)}: owner must be ${expectedOwner}`);
  }
  return [...violations, ...checkPrivateImports(root, modulePath, modules)];
}

function moduleOwner(root, modulePath) {
  const segments = relative(root, modulePath).split(/[\\/]/u);
  const sourceIndex = segments.indexOf("src");
  return [...segments.slice(0, sourceIndex), "modules", segments.at(-1)].join("/");
}

function checkPrivateImports(root, modulePath, modules) {
  return findSourceFiles(modulePath).flatMap((file) =>
    readImports(file).flatMap((specifier) => {
      if (!specifier.startsWith(".")) return [];
      const target = resolve(dirname(file), specifier);
      const importedModule = modules.find((candidate) => contains(candidate, target));
      return importedModule && importedModule !== modulePath
        ? [`${relative(root, file)}: imports private module path ${specifier}`]
        : [];
    }),
  );
}

function findSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(path);
    return sourceExtensions.has(extension(path)) ? [path] : [];
  });
}

function readImports(file) {
  const imports = [];
  const expression = /(?:from\s*|import\s*)["']([^"']+)["']/gu;
  for (const match of readFileSync(file, "utf8").matchAll(expression)) imports.push(match[1]);
  return imports;
}

function contains(directory, path) {
  const difference = relative(directory, path);
  return difference === "" || (!difference.startsWith("..") && !difference.startsWith(".."));
}

function extension(path) {
  return path.slice(path.lastIndexOf("."));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const modules = checkModuleBoundaries(process.cwd());
  console.log(`Module boundaries are valid for ${modules.length} module(s).`);
}
