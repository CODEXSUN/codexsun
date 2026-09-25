#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getApplication, loadRegistry } from "../packages/app-cli/src/registry.mjs";

const root = resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const registry = loadRegistry(root);

const defaultTests = [
  workspace("@codexsun/framework"),
  workspace("@codexsun/platform-core"),
  workspace("@codexsun/platform-api"),
  workspace("@codexsun/platform-web"),
  workspace("@codexsun/ui"),
  workspace("@codexsun/zetro-api"),
  workspace("@codexsun/zetro-web"),
  workspace("@codexsun/platform-desktop"),
  workspace("@codexsun/platform-mobile"),
  workspace("@codexsun/cxforge-api"),
  application("zuno"),
  workspace("@codexsun/app-cli"),
  workspace("@codexsun/remote-ops-mcp"),
  nodeTest("tools/create-module.test.mjs"),
  nodeTest("tools/turbo-scope.test.mjs"),
  nodeTest("tools/check-module-boundaries.test.mjs"),
  nodeTest("tools/check-app-architecture.test.mjs"),
  nodeTest("tools/version-bump.test.mjs"),
  nodeTest("tools/line-endings.test.mjs"),
  nodeTest("tools/app-worktree.test.mjs"),
  nodeTest("tools/app-build.test.mjs"),
];

const fixedTests = {
  "ui-system": [
    workspace("@codexsun/ui"),
    workspace("@codexsun/uiux-web", "typecheck"),
  ],
};

const fixedBuilds = {
  platform: turboScope("platform"),
  zetro: turboScope("zetro"),
  uiux: turboScope("uiux"),
  packages: turboScope("packages"),
  codeitz: turboScope("codeitz"),
};

export function runStack(command, rawArguments = process.argv.slice(3)) {
  const stack = parseStack(rawArguments);
  if (command === "test") {
    const tasks = stack === "all" ? defaultTests : fixedTests[stack] ?? [application(stack)];
    return runTasks(tasks);
  }
  if (command === "build") return runBuild(stack);
  if (command === "addons") return runAddons(rawArguments);
  throw new Error(`Unknown stack command ${command}. Use test, build, or addons.`);
}

function runBuild(stack) {
  if (stack === "all") {
    runNode("tools/clean-root-layout.mjs");
    runCommand("turbo", ["run", "build"]);
    runNode("tools/clean-root-layout.mjs");
    return runNode("tools/check-root-layout.mjs");
  }
  if (fixedBuilds[stack]) return runNode("tools/turbo-scope.mjs", [stack, "build"]);
  if (stack === "addons") return runAddonTask("all", "check");
  return runNode("packages/app-cli/src/main.mjs", ["build", stack]);
}

function runAddons(rawArguments) {
  const args = rawArguments.length ? rawArguments : ["--list"];
  if (args[0] === "--list" || args[0] === "list") return runNode("packages/app-cli/src/main.mjs", ["list", "addons"]);
  if (["create", "enable", "disable", "install", "uninstall"].includes(args[0])) return runNode("packages/app-cli/src/main.mjs", [args[0], "addon", ...args.slice(1)]);
  if (args[0] === "--all") return runAddonTask("all", args[1] ?? "check");
  if (args[0] === "--check" || args[0] === "--test") return runAddonTask(args[1], args[0].slice(2));
  if (args[0].startsWith("--")) return runAddonTask(args[0].slice(2), args[1] ?? "check");
  return runAddonTask(args[0], args[1] ?? "check");
}

function runAddonTask(id, task) {
  const addons = id === "all" ? ["runtime", ...registry.addons.map((addon) => addon.id)] : [id];
  for (const addon of addons) {
    const packageName = addon === "runtime" ? "@codexsun/addon-runtime" : registry.addons.find((item) => item.id === addon)?.package;
    if (!packageName) throw new Error(`Unknown add-on: ${addon}.`);
    runWorkspaceTask(packageName, task);
  }
}

function runTasks(tasks) {
  for (const task of tasks) task();
}

function application(id) {
  return () => {
    const selected = getApplication(root, id);
    for (const host of selected.hosts) {
      if (workspaceHasScript(host.workspace, "test")) runWorkspaceTask(host.workspace, "test");
    }
  };
}

function workspace(name, task = "test") {
  return () => runWorkspaceTask(name, task);
}

function runWorkspaceTask(name, task) {
  if (!workspaceHasScript(name, task)) throw new Error(`Workspace ${name} does not declare a ${task} script.`);
  runCommand(npm, ["run", task, "--workspace", name]);
}

function workspaceHasScript(name, script) {
  const packagePath = resolveWorkspacePackage(name);
  if (!packagePath) return false;
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  return typeof packageJson.scripts?.[script] === "string";
}

function resolveWorkspacePackage(name) {
  const candidates = [
    ...registry.applications.flatMap((application) => application.hosts.map((host) => resolve(root, application.owner, host.environmentDirectory, "package.json"))),
    resolve(root, "packages", "framework", "package.json"),
    resolve(root, "packages", "platform-core", "package.json"),
    resolve(root, "packages", "ui", "package.json"),
    resolve(root, "packages", "app-cli", "package.json"),
    resolve(root, "packages", "remote-ops-mcp", "package.json"),
    resolve(root, "packages", "addons", "runtime", "package.json"),
    ...registry.addons.map((addon) => resolve(root, addon.owner, "package.json")),
  ];
  return candidates.find((candidate) => existsSync(candidate) && JSON.parse(readFileSync(candidate, "utf8")).name === name);
}

function turboScope(scope) {
  return () => runNode("tools/turbo-scope.mjs", [scope, "build"]);
}

function nodeTest(path) {
  return () => runCommand(process.execPath, ["--test", path]);
}

function runNode(path, args = []) {
  return runCommand(process.execPath, [path, ...args]);
}

function runCommand(command, args) {
  if (process.platform === "win32" && command === npm) {
    const commandLine = [command, ...args].join(" ");
    return execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", commandLine], { cwd: root, stdio: "inherit" });
  }
  return execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

export function parseStack(args) {
  if (!args.length || args[0] === "--all") return "all";
  if (args[0] === "--stack") {
    if (!args[1]) throw new Error("Use --stack <name>.");
    return args[1];
  }
  if (!args[0].startsWith("--")) return args[0];
  return args[0].slice(2);
}

function help() {
  return [
    "Usage:",
    "  npm run test -- --<stack>",
    "  npm run test -- --stack <stack>",
    "  npm run build -- --<stack>",
    "  npm run addons -- --<addon> [check|test]",
    "  npm run addons -- --all [check|test]",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes("--help")) console.log(help());
    else runStack(process.argv[2]);
  } catch (error) {
    console.error(`\n  x ${error.message}\n`);
    process.exitCode = 1;
  }
}
