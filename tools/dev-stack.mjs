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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    startDevStack(process.argv[2]);
  } catch (error) {
    console.error(`\n  x ${error.message}\n`);
    process.exitCode = 1;
  }
}
