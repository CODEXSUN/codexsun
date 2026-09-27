#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const mainRoot = resolve(import.meta.dirname, "..");
const sitesRoot = resolve(mainRoot, "..", "sites");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const pidFile = resolve(mainRoot, ".codexsun-sites.pids.json");
const children = [];

if (!existsSync(resolve(sitesRoot, ".git")) || !existsSync(resolve(sitesRoot, "package.json"))) {
  throw new Error(`External Sites repository is unavailable: ${sitesRoot}`);
}

const action = process.argv[2] ?? "start";
if (action === "stop") {
  await stopAll();
} else if (action === "start") {
  await startAll();
} else {
  throw new Error("Usage: node tools/external-sites.mjs [start|stop]");
}

async function startAll() {
  const environment = { ...process.env };
  const targets = [
    ["api", ["run", "dev", "--workspace", "@codexsun/sites-api"]],
    ["web", ["run", "dev", "--workspace", "@codexsun/sites-web"]],
  ];

  for (const [name, args] of targets) {
    const child = spawn(npmCommand, args, {
      cwd: sitesRoot,
      env: environment,
      stdio: "inherit",
      windowsHide: false,
    });
    children.push({ child, name });
    child.once("error", (error) => {
      console.error(`Sites ${name} process failed: ${error.message}`);
      process.exitCode = 1;
    });
    child.once("exit", (code, signal) => {
      if (code && !process.exitCode) process.exitCode = code;
      if (signal && !process.exitCode) process.exitCode = 1;
    });
  }

  await writeFile(pidFile, JSON.stringify(children.map(({ child, name }) => ({ name, pid: child.pid }))), "utf8");

  const stop = () => void stopAll();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

async function stopAll() {
  if (!children.length) {
    await stopRecordedProcesses();
    return;
  }
  await Promise.all(children.map(({ child }) => stopProcess(child)));
  await removePidFile();
}

async function stopRecordedProcesses() {
  try {
    const records = JSON.parse(await readFile(pidFile, "utf8"));
    await Promise.all(records.map(({ pid }) => stopProcess({ pid, exitCode: null })));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  } finally {
    await removePidFile();
  }
}

async function removePidFile() {
  try {
    await unlink(pidFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function stopProcess(child) {
  if (child.exitCode !== null || !child.pid) return Promise.resolve();
  if (process.platform === "win32") {
    return new Promise((resolveStop) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
      killer.once("exit", resolveStop);
      killer.once("error", resolveStop);
    });
  }
  child.kill("SIGTERM");
  return new Promise((resolveStop) => child.once("exit", resolveStop));
}
