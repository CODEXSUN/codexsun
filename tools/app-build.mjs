#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scopeWorkspaces } from "./turbo-scope.mjs";

export function createAppBuildCommand(scope, extraArgs = []) {
  if (!scopeWorkspaces[scope]) {
    throw new Error(`Unknown application: ${scope}. Use one of: ${Object.keys(scopeWorkspaces).join(", ")}.`);
  }

  return [resolve(import.meta.dirname, "turbo-scope.mjs"), scope, "build", ...extraArgs];
}

function main() {
  const [scope, ...extraArgs] = process.argv.slice(2);
  const command = createAppBuildCommand(scope, extraArgs);
  const result = spawnSync(process.execPath, command, { cwd: resolve(import.meta.dirname, ".."), stdio: "inherit" });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`\n  Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}
