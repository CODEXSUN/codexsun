import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { readLatestVersionedChangelogEntry } from "./changelog.mjs";

const root = resolve(import.meta.dirname, "..");
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const expected = rootPackage.version;
const entry = readLatestVersionedChangelogEntry(root);
if (entry.version !== expected) {
  throw new Error(`Changelog version ${entry.version} does not match package version ${expected}.`);
}

const changelog = readFileSync(join(root, "assist", "documentation", "CHAGELOG.md"), "utf8");
for (const value of versionStateValues(expected)) {
  if (!changelog.includes(value)) throw new Error(`CHAGELOG.md is missing ${value}.`);
}

for (const file of workspacePackageFiles(root, rootPackage.workspaces ?? [])) {
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  if (pkg.version !== expected) {
    throw new Error(`${file} has version ${pkg.version}, expected ${expected}.`);
  }
}

checkLockfile(root, expected);
console.log(`CODEXSUN version alignment is valid: v-${expected}.`);

function versionStateValues(version) {
  return [`Current version: ${version}`, `Release tag: v-${version}`, `Changelog label: v ${version}`];
}

function workspacePackageFiles(rootDir, patterns) {
  return patterns
    .flatMap((pattern) => expand(rootDir, pattern))
    .map((directory) => join(directory, "package.json"))
    .filter((file) => existsSync(file));
}

function expand(rootDir, pattern) {
  return pattern
    .split(/[\\/]/u)
    .filter(Boolean)
    .reduce((paths, part) => paths.flatMap((path) => expandDirectory(path, part)), [rootDir]);
}

function expandDirectory(path, part) {
  if (part !== "*") return [join(path, part)];
  return readdirSync(path)
    .map((entry) => join(path, entry))
    .filter((entry) => statSync(entry).isDirectory());
}

function checkLockfile(rootDir, expected) {
  const file = join(rootDir, "package-lock.json");
  if (!existsSync(file)) return;

  const lock = JSON.parse(readFileSync(file, "utf8"));
  if (lock.version !== expected || lock.packages?.[""]?.version !== expected) {
    throw new Error(`package-lock.json does not match version ${expected}.`);
  }
}
