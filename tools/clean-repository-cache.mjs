#!/usr/bin/env node

import { lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const cachePaths = [
  "dist/.cache",
  "dist/.tmp",
  "node_modules/.cache",
  "node_modules/.vite",
  "node_modules/.vite-temp"
];

export class RepositoryCacheCleanup {
  constructor(root) {
    this.root = realpathSync(root);
    if (JSON.parse(readFileSync(join(this.root, "package.json"), "utf8")).name !== "codexsun")
      throw new Error("Cache cleanup requires the CODEXSUN repository root.");
  }

  run(dryRun = false) {
    const targets = cachePaths.map((path) => join(this.root, path));
    // Check every target before removing anything, including links inside caches.
    for (const target of targets) this.validate(target);
    if (!dryRun) this.assertNoRunningDevServices();
    const removed = [];
    const failures = [];
    for (const target of targets) {
      if (!this.stat(target)) continue;
      try {
        this.validate(target);
        if (!dryRun)
          rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
        removed.push(relative(this.root, target).split(sep).join("/"));
      } catch (error) {
        failures.push(`${relative(this.root, target)}: ${error.message}`);
      }
    }
    return { removed, failures };
  }

  validate(target) {
    const path = resolve(target);
    if (!cachePaths.some((allowed) => path === join(this.root, allowed)))
      throw new Error("Refusing a path outside the fixed cache allowlist.");
    const parts = relative(this.root, path).split(sep);
    let current = this.root;
    for (const part of parts) {
      current = join(current, part);
      const entry = this.stat(current);
      if (!entry) return;
      if (entry.isSymbolicLink()) throw new Error(`Refusing cache link or junction: ${current}`);
      if (!entry.isDirectory()) throw new Error(`Expected a cache directory: ${current}`);
    }
    this.validateContents(path);
  }

  assertNoRunningDevServices() {
    const directory = join(this.root, "dist/.tmp");
    if (!this.stat(directory)) return;
    for (const name of readdirSync(directory)) {
      const match = name.match(/^codexsun-dev-(?:preflight|stack)-(\d+)\.json$/u);
      if (!match) continue;
      const pid = Number(match[1]);
      try {
        const control = JSON.parse(readFileSync(join(directory, name), "utf8"));
        if (control.pid !== pid) continue;
        process.kill(pid, 0);
      } catch (error) {
        if (error.code !== "EPERM") continue;
      }
      throw new Error(
        `Development process ${pid} is running. Stop development services before cache cleanup.`
      );
    }
  }

  validateContents(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing cache link or junction: ${path}`);
      if (entry.isDirectory()) this.validateContents(path);
    }
  }

  stat(path) {
    try {
      return lstatSync(path);
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--dry-run"))
      throw new Error(
        "Usage: npm run clean:cache -- [--dry-run]. Arbitrary paths are not accepted."
      );
    const dryRun = args.includes("--dry-run");
    const result = new RepositoryCacheCleanup(resolve(import.meta.dirname, "..")).run(dryRun);
    for (const path of result.removed)
      console.log(`${dryRun ? "Would remove" : "Removed"}: ${path}`);
    for (const failure of result.failures) console.error(failure);
    if (result.failures.length) {
      console.error("Close tools using these caches, then retry cleanup.");
      process.exitCode = 1;
    } else
      console.log(
        "Cache cleanup complete. Build outputs, root dependencies, and storage preserved."
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
