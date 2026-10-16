#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const rootDist = resolve(root, "dist");
const gradleCache = resolve(rootDist, ".cache/gradle");
const androidRoot = resolve(root, "apps/crm/mobile/android");
const wrapper = resolve(androidRoot, process.platform === "win32" ? "gradlew.bat" : "gradlew");

// Idle Gradle daemons hold cache files open on Windows.
if (existsSync(gradleCache) && existsSync(wrapper)) {
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? "powershell.exe" : "sh",
    windows
      ? ["-NoProfile", "-Command", "& $env:CODEXSUN_GRADLE_WRAPPER --stop"]
      : [wrapper, "--stop"],
    {
      cwd: androidRoot,
      env: { ...process.env, GRADLE_USER_HOME: gradleCache, CODEXSUN_GRADLE_WRAPPER: wrapper },
      stdio: "inherit"
    }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Stop Gradle before cleaning root dist.");
}

rmSync(rootDist, { force: true, recursive: true });

console.log(`Cleaned root build output at ${rootDist}`);
