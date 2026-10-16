#!/usr/bin/env node

import { copyFileSync, mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

if (process.platform !== "win32" || basename(process.execPath).toLowerCase() !== "node.exe") {
  throw new Error("Q Cafe installers must be built with Node.js on Windows.");
}
const resourceDir = join(root, "dist", "apps", "qcafe", "desktop", "resources");
mkdirSync(resourceDir, { recursive: true });
copyFileSync(process.execPath, join(resourceDir, "node.exe"));
console.log("Q Cafe Node runtime is staged under root dist.");
