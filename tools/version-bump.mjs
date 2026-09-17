#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const changelogPath = join("assist", "documentation", "CHAGELOG.md");

export function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version);
  if (!match) throw new Error(`Unsupported version format: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function bumpNextVersion(rootDir, title, databaseUpdate) {
  if (!title?.trim()) throw new Error("A version title is required.");
  if (typeof databaseUpdate !== "boolean") {
    throw new Error("A database update classification is required.");
  }

  const currentVersion = readVersion(resolve(rootDir, "package.json"));
  const nextVersion = bumpPatch(currentVersion);
  const packages = workspacePackageFiles(rootDir);
  for (const file of packages) writeVersion(file, nextVersion);
  updateLockfile(rootDir, packages, nextVersion);
  updateChangelog(rootDir, nextVersion, title.trim(), databaseUpdate);
  return { currentVersion, nextVersion, reference: Number(nextVersion.split(".")[2]) };
}

function workspacePackageFiles(rootDir) {
  const rootPackage = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8"));
  const files = new Set([resolve(rootDir, "package.json")]);
  for (const pattern of rootPackage.workspaces ?? []) {
    for (const directory of expandPattern(rootDir, pattern)) {
      const file = join(directory, "package.json");
      if (existsSync(file)) files.add(file);
    }
  }
  return [...files].sort();
}

function expandPattern(rootDir, pattern) {
  return pattern
    .split(/[\\/]/u)
    .filter(Boolean)
    .reduce(
      (directories, part) => directories.flatMap((directory) => expandWorkspaceDirectory(directory, part)),
      [rootDir],
    );
}

function expandWorkspaceDirectory(directory, part) {
  if (part !== "*") {
    const path = join(directory, part);
    return existsSync(path) ? [path] : [];
  }

  return readdirSync(directory)
    .map((entry) => join(directory, entry))
    .filter((path) => statSync(path).isDirectory());
}

function writeVersion(file, version) {
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function updateLockfile(rootDir, packageFiles, version) {
  const file = resolve(rootDir, "package-lock.json");
  if (!existsSync(file)) return;
  const lock = JSON.parse(readFileSync(file, "utf8"));
  const paths = new Set(packageFiles.map((item) => relative(rootDir, dirname(item)).replaceAll("\\", "/")));
  lock.version = version;
  for (const [path, pkg] of Object.entries(lock.packages ?? {})) {
    if (path === "" || paths.has(path)) pkg.version = version;
  }
  writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
}

function updateChangelog(rootDir, version, title, databaseUpdate) {
  const file = resolve(rootDir, changelogPath);
  let content = readFileSync(file, "utf8");
  content = content
    .replace(/Current version: .*/u, `Current version: ${version}`)
    .replace(/Release tag: .*/u, `Release tag: v-${version}`)
    .replace(/Changelog label: .*/u, `Changelog label: v ${version}`);
  const entry = `## v-${version}\n\n### [v ${version}] ${timestamp()} - ${title}\n\n#### Database Changes\n\n- Database update: ${databaseUpdate ? "Yes" : "No"} (manual).\n\n#### App Codebase Changes\n\n- Bumped CODEXSUN workspace version to ${version}.\n\n`;
  const index = content.indexOf("## v-");
  if (index < 0) throw new Error("CHAGELOG.md does not contain a version entry.");
  writeFileSync(file, `${content.slice(0, index)}${entry}${content.slice(index)}`, "utf8");
}

function readVersion(file) {
  return String(JSON.parse(readFileSync(file, "utf8")).version);
}

function timestamp() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day} ${hour % 12 || 12}:${minute} ${hour >= 12 ? "pm" : "am"}`;
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const title = option("--title");
  const databaseUpdate = process.argv.includes("--database-update");
  const noDatabaseUpdate = process.argv.includes("--no-database-update");
  if (databaseUpdate === noDatabaseUpdate) {
    throw new Error("Choose exactly one of --database-update or --no-database-update.");
  }
  const result = bumpNextVersion(root, title, databaseUpdate);
  console.log(`Bumped ${result.currentVersion} to ${result.nextVersion}.`);
}
