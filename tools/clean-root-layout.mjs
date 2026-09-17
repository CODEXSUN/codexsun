import { readdirSync, rmSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = process.cwd();
const allowed = new Set([resolve(root, "node_modules"), resolve(root, "dist"), resolve(root, "dist/.turbo")]);
const targets = [];

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = resolve(directory, entry.name);
    if (allowed.has(path)) continue;
    if (["node_modules", "dist", ".turbo"].includes(entry.name)) targets.push(path);
    else scan(path);
  }
}

scan(root);
for (const target of targets) rmSync(target, { recursive: true, force: true });
console.log(`Removed ${targets.length} forbidden workspace directories.`);
console.log(targets.map((target) => relative(root, target)).join("\n"));
