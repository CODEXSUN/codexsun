#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getApplication, loadRegistry } from "../packages/app-cli/src/registry.mjs";

const root = resolve(import.meta.dirname, "..");
const registry = loadRegistry(root);

export function startDevStack(modeOrApplication, rawArguments = process.argv.slice(3)) {
  const { targets } = resolveDevTargets(modeOrApplication, rawArguments);

  let stopping = false;
  const children = targets.map(startHost);
  const stop = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    await Promise.all(children.map(stopHost));
  };

  children.forEach((child) => {
    child.once("exit", (code) => void stop(code ?? 1));
    child.once("error", () => void stop(1));
  });
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
}

export async function stopDevStack(modeOrApplication) {
  const { targets } = resolveDevTargets(modeOrApplication);
  await Promise.all(targets.map((target) => runProcess(process.execPath, ["tools/preflight.mjs", target, "--stop"], "inherit")));
}

export function resolveDevTargets(modeOrApplication, rawArguments = []) {
  const { applicationId, mode } = resolveRequest(modeOrApplication, rawArguments);
  const application = getApplication(root, applicationId);
  const hosts = application.hosts.filter((host) => mode === "app" ? ["api", "web"].includes(host.kind) : host.kind === mode);
  if (!hosts.length) throw new Error(`${applicationId} does not declare a ${mode} host.`);
  return { applicationId, mode, targets: hosts.map((host) => host.target) };
}

function resolveRequest(modeOrApplication, rawArguments) {
  if (["api", "web"].includes(modeOrApplication)) {
    return { applicationId: readApplicationId(rawArguments), mode: modeOrApplication };
  }
  if (modeOrApplication === "app") return { applicationId: readApplicationId(rawArguments), mode: "app" };
  return { applicationId: readApplicationId([modeOrApplication, ...rawArguments]), mode: "app" };
}

function readApplicationId(args) {
  const argument = args.find((value) => value.startsWith("--"));
  const applicationId = argument ? argument.slice(2) : args[0];
  if (!applicationId) throw new Error(`Choose an application. Available: ${registry.applications.map((application) => application.id).join(", ")}.`);
  return applicationId;
}

function startHost(target) {
  return spawn(process.execPath, ["tools/preflight.mjs", target, "--restart"], { cwd: root, stdio: "inherit" });
}

function stopHost(child) {
  if (child.exitCode !== null || !child.pid) return Promise.resolve();
  if (process.platform === "win32") {
    return runProcess("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
  }
  child.kill("SIGINT");
  return new Promise((resolveStop) => child.once("exit", resolveStop));
}

function runProcess(command, args, stdio = "ignore") {
  return new Promise((resolveProcess, rejectProcess) => {
    const processHandle = spawn(command, args, { stdio, windowsHide: true });
    processHandle.once("error", rejectProcess);
    processHandle.once("exit", (code) => {
      if (code === 0 || (process.platform === "win32" && command === "taskkill" && code === 128)) resolveProcess();
      else rejectProcess(new Error(`${command} exited with code ${code ?? "unknown"}.`));
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const action = process.argv.includes("--stop") ? stopDevStack(process.argv[2]) : startDevStack(process.argv[2]);
  Promise.resolve(action).catch((error) => {
    console.error(`\n  x ${error.message}\n`);
    process.exitCode = 1;
  });
}
