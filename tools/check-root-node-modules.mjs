#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workspaceRoots = ["apps", "devkits", "packages", "tools"].map((directory) =>
  join(root, directory)
);
const nestedDependencyTrees = [];
const misplacedArtifacts = [];
const artifactNames = new Set(["dist", "dist-types", "target", "build", ".dart_tool", ".gradle"]);
const rootDist = join(root, "dist") + sep;
const lockfile = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
const missingWorkspaceLinks = Object.entries(lockfile.packages)
  .filter(([path, metadata]) => path.startsWith("node_modules/") && metadata.link)
  .map(([path]) => path)
  .filter((path) => !existsSync(join(root, path, "package.json")));

function findNestedDependencyTrees(directory) {
  if (!existsSync(directory)) {
    return;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.name === "node_modules" && (entry.isDirectory() || entry.isSymbolicLink())) {
      nestedDependencyTrees.push(relative(root, fullPath));
      continue;
    }
    if (entry.isSymbolicLink() && artifactNames.has(entry.name)) {
      const target = existsSync(fullPath)
        ? realpathSync(fullPath)
        : resolve(dirname(fullPath), readlinkSync(fullPath));
      if (!target.startsWith(rootDist)) misplacedArtifacts.push(relative(root, fullPath));
      continue;
    }
    if (!entry.isDirectory()) {
      continue;
    }
    if (artifactNames.has(entry.name)) {
      misplacedArtifacts.push(relative(root, fullPath));
      continue;
    }

    findNestedDependencyTrees(fullPath);
  }
}

for (const workspaceRoot of workspaceRoots) {
  findNestedDependencyTrees(workspaceRoot);
}

if (misplacedArtifacts.length > 0) {
  console.error("Generated workspace artifacts must live in root dist:");
  for (const path of misplacedArtifacts) console.error(`- ${path}`);
  process.exit(1);
}

if (nestedDependencyTrees.length > 0) {
  console.error("Workspace-local node_modules folders are not allowed:");
  for (const directory of nestedDependencyTrees) {
    console.error(`- ${directory}`);
  }
  console.error("Run npm run dependencies:clean from the repository root.");
  process.exit(1);
}

if (missingWorkspaceLinks.length > 0) {
  console.error("Root workspace links are missing:");
  for (const path of missingWorkspaceLinks) console.error(`- ${path}`);
  console.error("Run npm install from the repository root.");
  process.exit(1);
}

console.log("Dependency layout verified: workspace packages use the root node_modules");
