#!/usr/bin/env node

import { prepareNativeOutput } from "./prepare-native-output.mjs";

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import "./stage-qcafe-desktop.mjs";

prepareNativeOutput("qcafe");

const root = resolve(import.meta.dirname, "..");
const temporaryDirectory = join(root, "dist", "apps", "qcafe", "desktop", "tmp");
const npmCacheDirectory = join(root, "dist", "apps", "qcafe", "desktop", "npm-cache");
const targetDirectory = join(root, "dist", "apps", "qcafe", "desktop", "target");
mkdirSync(temporaryDirectory, { recursive: true });
mkdirSync(npmCacheDirectory, { recursive: true });

const child = spawn(
  process.execPath,
  [join(root, "node_modules", "@tauri-apps", "cli", "tauri.js"), "build", "--bundles", "nsis,msi"],
  {
    cwd: join(root, "apps", "qcafe", "desktop"),
    env: {
      ...process.env,
      CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? targetDirectory,
      npm_config_cache: npmCacheDirectory,
      TEMP: temporaryDirectory,
      TMP: temporaryDirectory
    },
    stdio: "inherit"
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
