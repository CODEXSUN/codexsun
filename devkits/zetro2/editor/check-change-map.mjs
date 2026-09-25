// Asserts the maintained change map matches the live upstream diff (task 2.6).
// Fails when zvcode has modifications, additions, or removals that are not
// recorded in source-change-map.json, or when the map lists paths that no
// longer differ.
// Usage: node devkits/zetro2/editor/check-change-map.mjs

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const editorDir = path.dirname(fileURLToPath(import.meta.url));
const manifestTool = path.join(editorDir, "zvcode-manifest.mjs");
const mapPath = path.join(editorDir, "source-change-map.json");
const diffPath = path.resolve(editorDir, "../../../dist/zetro2/zvcode-upstream-diff.json");

const run = spawnSync(process.execPath, [manifestTool, "--diff"], {
  cwd: path.resolve(editorDir, "../../.."),
  encoding: "utf8",
  timeout: 120000,
});
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(run.status ?? 1);
}

const diff = JSON.parse(await readFile(diffPath, "utf8"));
const map = JSON.parse(await readFile(mapPath, "utf8"));

const mapPaths = new Set(map.changes.map((entry) => entry.path));
const livePaths = new Set([...diff.modified, ...diff.added, ...diff.removed]);

const unmapped = [...livePaths].filter((p) => !mapPaths.has(p)).sort();
const stale = [...mapPaths].filter((p) => !livePaths.has(p)).sort();

if (unmapped.length > 0 || stale.length > 0) {
  if (unmapped.length > 0) {
    console.error(`Unmapped local changes (update source-change-map.*): ${unmapped.join(", ")}`);
  }
  if (stale.length > 0) {
    console.error(`Map entries no longer differing from upstream (remove or re-verify): ${stale.join(", ")}`);
  }
  process.exit(1);
}

console.log(
  `Change map matches live upstream diff: ${livePaths.size} paths ` +
    `(${diff.modifiedCount} modified, ${diff.addedCount} added, ${diff.removedCount} removed).`,
);
