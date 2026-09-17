import { readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = process.cwd();
const allowed = new Set([resolve(root, "node_modules"), resolve(root, "dist"), resolve(root, "dist/.turbo")]);
const violations = [];

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = resolve(directory, entry.name);
    if (allowed.has(path)) continue;
    if (["node_modules", "dist", ".turbo"].includes(entry.name)) violations.push(relative(root, path));
    else scan(path);
  }
}

scan(root);
if (violations.length) throw new Error(`Forbidden workspace directories: ${violations.join(", ")}`);
console.log("Root workspace layout is valid.");
