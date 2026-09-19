#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getApplication, getRuntimeTargets, loadRegistry, updateProfile, verifyRegistry } from "./registry.mjs";
import { createApplication } from "./app-scaffold.mjs";
import { removeApplication } from "./app-uninstall.mjs";
import { createAddon } from "./addon-scaffold.mjs";
import { syncMdiCatalog } from "./mdi-catalog.mjs";

const root = resolve(import.meta.dirname, "../../..");

export async function run(argumentsList, rootDir = root) {
  const [command, ...args] = argumentsList;
  if (!command) return runInteractive(rootDir);
  if (command === "list") return list(args[0] ?? "applications", rootDir);
  if (command === "verify") return console.log(JSON.stringify(verifyRegistry(rootDir), null, 2));
  if (command === "create") return create(args, rootDir);
  if (command === "remove") return remove(args, rootDir);
  if (command === "create-addon") return createAddonCommand(args, rootDir);
  if (command === "sync") return console.log(syncMdiCatalog(rootDir));
  if (["enable", "install", "disable", "uninstall"].includes(command)) {
    return update(args, command === "enable" || command === "install", rootDir);
  }
  if (command === "build") return build(args, rootDir);
  if (command === "dev") return dev(args, rootDir);
  throw new Error(help());
}

function list(kind, rootDir) {
  const registry = loadRegistry(rootDir);
  if (kind === "applications") return console.log(registry.applications.map((item) => `${item.id}\t${item.label}`).join("\n"));
  if (kind === "addons") return console.log(registry.addons.map((item) => `${item.id}\t${item.label}`).join("\n"));
  throw new Error("Use list applications or list addons.");
}

function update(args, enabled, rootDir) {
  const [kind, id, ...options] = args;
  if (!new Set(["application", "addon"]).has(kind) || !id) throw new Error("Use install|uninstall <application|addon> <id> [--profile development].");
  const profile = optionValue(options, "--profile") ?? "development";
  console.log(JSON.stringify(updateProfile(rootDir, profile, kind, id, enabled), null, 2));
}

function build(args, rootDir) {
  const [application, ...extra] = args;
  getApplication(rootDir, application);
  runNode([resolve(rootDir, "tools", "app-build.mjs"), application, ...extra], rootDir);
}

function create(args, rootDir) {
  const [id, ...options] = args;
  const application = createApplication(rootDir, {
    apiPort: optionValue(options, "--api-port"),
    id,
    label: optionValue(options, "--label"),
    taskPrefix: optionValue(options, "--prefix"),
    webPort: optionValue(options, "--web-port"),
  });
  console.log(JSON.stringify(application, null, 2));
}

function remove(args, rootDir) {
  const [id] = args;
  if (!id) throw new Error("Use remove <application>.");
  console.log(JSON.stringify(removeApplication(rootDir, id), null, 2));
}

function createAddonCommand(args, rootDir) {
  const [id, ...options] = args;
  console.log(JSON.stringify(createAddon(rootDir, { id, label: optionValue(options, "--label") }), null, 2));
}

function dev(args, rootDir) {
  const [application, host, ...extra] = args;
  const selected = getApplication(rootDir, application);
  const target = selected.hosts.find((item) => item.kind === host || item.target === host);
  if (!target) throw new Error(`Use a ${application} host: ${selected.hosts.map((item) => item.kind).join(", ")}.`);
  if (!getRuntimeTargets(rootDir)[target.target]) throw new Error(`No runtime target exists for ${target.target}.`);
  runNode([resolve(rootDir, "tools", "preflight.mjs"), target.target, ...extra], rootDir);
}

async function runInteractive(rootDir) {
  const registry = loadRegistry(rootDir);
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const command = (await readline.question("Action (list, verify, create, install, uninstall): ")).trim();
    if (command === "list" || command === "verify") return run([command], rootDir);
    if (command === "create") {
      const id = (await readline.question("Application ID: ")).trim();
      const label = (await readline.question("Application label: ")).trim();
      return run([command, id, ...(label ? ["--label", label] : [])], rootDir);
    }
    const kind = (await readline.question("Kind (application, addon): ")).trim();
    const options = kind === "application" ? registry.applications : registry.addons;
    const id = (await readline.question(`Id (${options.map((item) => item.id).join(", ")}): `)).trim();
    return run([command, kind, id], rootDir);
  } finally {
    readline.close();
  }
}

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status) process.exitCode = result.status;
}

function optionValue(options, name) {
  const index = options.indexOf(name);
  return index === -1 ? undefined : options[index + 1];
}

function help() {
  return "Use: codexsun-app <list|verify|create|remove|create-addon|sync|install|uninstall|build|dev>.";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch((error) => {
    console.error(`\n  Error: ${error.message}\n`);
    process.exitCode = 1;
  });
}
