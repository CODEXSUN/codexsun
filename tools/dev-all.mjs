#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getRuntimeTargets } from "../packages/app-cli/src/registry.mjs";

const root = resolve(import.meta.dirname, "..");
const runtimeTargets = getRuntimeTargets(root);
const targetGroups = Object.fromEntries(
  ["api", "web"].map((kind) => [kind, Object.entries(runtimeTargets).filter(([, target]) => target.environmentDirectory === kind).map(([name]) => name)]),
);

function main() {
  const group = process.argv[2];
  const targets = targetGroups[group];
  if (!targets) throw new Error(`Usage: node tools/dev-all.mjs <${Object.keys(targetGroups).join("|")}>`);

  let stopping = false;
  const children = targets.map(startTarget);
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    children.forEach((child) => child.kill("SIGINT"));
  };

  children.forEach((child) => {
    child.once("exit", (code) => stop(code ?? 1));
    child.once("error", () => stop(1));
  });
  process.once("SIGINT", () => stop());
  process.once("SIGTERM", () => stop());
}

function startTarget(target) {
  return spawn(process.execPath, ["tools/preflight.mjs", target, "--restart"], {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`\n  x ${error.message}\n`);
    process.exitCode = 1;
  }
}
