#!/usr/bin/env node

import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import chalk from "chalk";

const root = resolve(import.meta.dirname, "..");
const targets = {
  "platform-api": {
    displayName: "Platform API",
    environmentDirectory: "api",
    envKey: "PLATFORM_API_PORT",
    workspace: "@codexsun/platform-api",
  },
  "platform-web": {
    displayName: "Platform web",
    environmentDirectory: "web",
    envKey: "PLATFORM_WEB_PORT",
    workspace: "@codexsun/platform-web",
  },
  "uiux-web": {
    displayName: "UIUX web",
    environmentDirectory: "web",
    envKey: "WEB_PORT",
    hostKey: "WEB_HOST",
    workspace: "@codexsun/uiux-web",
  },
  "zetro-api": {
    displayName: "Zetro API",
    application: "zetro",
    environmentDirectory: "api",
    envKey: "ZETRO_API_PORT",
    workspace: "@codexsun/zetro-api",
  },
  "zetro-web": {
    displayName: "Zetro web",
    application: "zetro",
    environmentDirectory: "web",
    envKey: "ZETRO_WEB_PORT",
    workspace: "@codexsun/zetro-web",
  },
  "orship-api": {
    displayName: "Orship API",
    application: "orship",
    environmentDirectory: "api",
    envKey: "ORSHIP_API_PORT",
    hostKey: "ORSHIP_HOST",
    workspace: "@codexsun/orship-api",
  },
  "orship-web": {
    displayName: "Orship web",
    application: "orship",
    environmentDirectory: "web",
    envKey: "ORSHIP_WEB_PORT",
    hostKey: "ORSHIP_HOST",
    workspace: "@codexsun/orship-web",
  },
  "platform-desktop": {
    displayName: "Platform desktop",
    environmentDirectory: "desktop",
    envKey: "PLATFORM_DESKTOP_PORT",
    workspace: "@codexsun/platform-desktop",
  },
  "platform-mobile": {
    displayName: "Platform mobile",
    environmentDirectory: "mobile",
    envKey: "PLATFORM_MOBILE_PORT",
    workspace: "@codexsun/platform-mobile",
  },
  "docs-api": {
    displayName: "Docs API",
    application: "docs",
    environmentDirectory: "api",
    envKey: "DOCS_API_PORT",
    workspace: "@codexsun/docs-api",
  },
  "docs-web": {
    displayName: "Docs web",
    application: "docs",
    environmentDirectory: "web",
    envKey: "DOCS_WEB_PORT",
    workspace: "@codexsun/docs-web",
  },
  "garments-api": {
    displayName: "Garments API",
    application: "garments",
    environmentDirectory: "api",
    envKey: "GARMENTS_API_PORT",
    workspace: "@codexsun/garments-api",
  },
  "garments-web": {
    displayName: "Garments web",
    application: "garments",
    environmentDirectory: "web",
    envKey: "GARMENTS_WEB_PORT",
    workspace: "@codexsun/garments-web",
  },
};

export class StartupPreflight {
  constructor(target, env) {
    this.target = target;
    this.env = env;
    this.host = parseRequiredHost(env[this.target.hostKey ?? "PLATFORM_HOST"], this.target.hostKey ?? "PLATFORM_HOST");
    this.port = parseRequiredPort(env[target.envKey], target.envKey);
    this.reservation = new PortReservation(root, this.port, target.workspace);
  }

  async check() {
    console.log(`\n  ${chalk.bold.cyan(">")} ${chalk.bold(this.target.displayName)} preflight`);
    console.log(`  ${chalk.dim("-")} Checking ${this.host}:${this.port}`);
    await this.reservation.acquire();

    try {
      await assertPortAvailable(this.host, this.port);
      console.log(`  ${chalk.green("ok")} Reserved ${this.host}:${this.port}\n`);
    } catch (error) {
      this.reservation.release();
      throw error;
    }
  }

  async start() {
    await this.stopExistingTarget();
    await this.check();
    const child = startWorkspace(this.target.workspace, this.env);
    const release = () => this.reservation.release();

    child.once("error", (error) => {
      release();
      console.error(`  x Could not start ${this.target.displayName}: ${error.message}`);
      process.exitCode = 1;
    });
    child.once("exit", (code) => {
      release();
      process.exitCode = code ?? 0;
    });
    attachShutdownHandlers(child, release);
  }

  async stop() {
    const owner = this.reservation.readOwner();
    if (!owner?.pid || owner.workspace !== this.target.workspace) {
      throw new Error(`No running ${this.target.displayName} process is recorded for port ${this.port}.`);
    }

    if (!isProcessRunning(owner.pid)) {
      this.reservation.removeStale();
      console.log(`  ${chalk.green("ok")} Cleared stale reservation for ${this.host}:${this.port}`);
      return;
    }

    console.log(`  ${chalk.dim("-")} Stopping ${this.target.workspace} (PID ${owner.pid})`);
    await stopProcessTree(owner.pid);
    await waitForPortAvailable(this.host, this.port);
    this.reservation.removeStale();
    console.log(`  ${chalk.green("ok")} Stopped ${this.target.displayName}\n`);
  }

  async restart() {
    await this.start();
  }

  async stopExistingTarget() {
    const owner = this.reservation.readOwner();
    if (owner?.pid && owner.workspace === this.target.workspace) {
      await this.stop();
    }
  }
}

class PortReservation {
  constructor(rootDir, port, workspace) {
    this.file = join(rootDir, "storage", "runtime", "ports", `${port}.lock`);
    this.workspace = workspace;
    this.acquired = false;
  }

  async acquire() {
    mkdirSync(resolve(this.file, ".."), { recursive: true });

    try {
      this.writeLock();
      this.acquired = true;
      return;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }

    const owner = this.readOwner();
    if (owner?.pid && isProcessRunning(owner.pid)) {
      throw new Error(
        `Port ${this.port()} is reserved by ${owner.workspace ?? "another CODEXSUN process"} (PID ${owner.pid}).`,
      );
    }

    unlinkSync(this.file);
    this.writeLock();
    this.acquired = true;
  }

  release() {
    if (!this.acquired) return;
    try {
      unlinkSync(this.file);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    this.acquired = false;
  }

  removeStale() {
    try {
      unlinkSync(this.file);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  port() {
    return Number(this.file.match(/(\d+)\.lock$/u)?.[1]);
  }

  readOwner() {
    try {
      return JSON.parse(readFileSync(this.file, "utf8"));
    } catch {
      return null;
    }
  }

  writeLock() {
    const descriptor = openSync(this.file, "wx");
    try {
      writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, workspace: this.workspace })}\n`, "utf8");
    } finally {
      closeSync(descriptor);
    }
  }
}

async function main() {
  const [targetName, mode] = process.argv.slice(2);
  const target = targets[targetName];
  if (!target || (mode && mode !== "--check" && mode !== "--restart" && mode !== "--stop")) {
    throw new Error(`Usage: node tools/preflight.mjs <${Object.keys(targets).join("|")}> [--check|--restart|--stop]`);
  }

  const preflight = new StartupPreflight(target, loadEnvironment(targetName));
  if (mode === "--check") {
    await preflight.check();
    preflight.reservation.release();
    return;
  }

  if (mode === "--stop") {
    await preflight.stop();
    return;
  }

  if (mode === "--restart") {
    await preflight.restart();
    return;
  }

  await preflight.start();
}

function loadEnvironment(targetName) {
  const target = targets[targetName];
  return {
    ...process.env,
    ...readEnvFile(join(root, ".env")),
    ...readEnvFile(appEnvironmentPath(targetName, target.environmentDirectory)),
  };
}

function appEnvironmentPath(targetName, environmentDirectory) {
  const app = targets[targetName].application ?? (targetName === "uiux-web" ? "uiux" : "platform");
  return join(root, "apps", app, environmentDirectory, ".app.env");
}

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/u))
      .filter(Boolean)
      .map((match) => [match[1].trim(), parseEnvValue(match[2])]),
  );
}

function parseEnvValue(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) return trimmed.slice(1, -1);
  return trimmed.replace(/\s+#.*$/u, "").trim();
}

function parseRequiredPort(value, envKey) {
  const port = Number(String(value ?? "").trim());
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Set ${envKey} to a valid port in .env or the app .app.env file.`);
  }
  return port;
}

function parseRequiredHost(value, envKey) {
  const host = String(value ?? "").trim();
  if (!host) throw new Error(`Set ${envKey} in .env or the app .app.env file.`);
  return host;
}

async function assertPortAvailable(host, port) {
  if (await canBind(host, port)) return;
  throw new Error(`Port ${port} is already in use. Stop its verified owner or choose another configured port.`);
}

async function waitForPortAvailable(host, port) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await canBind(host, port)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Port ${port} did not release after the recorded workspace process stopped.`);
}

function canBind(host, port) {
  return new Promise((resolveBind) => {
    const server = createServer();
    server.once("error", () => resolveBind(false));
    server.once("listening", () => server.close(() => resolveBind(true)));
    server.listen(port, host);
  });
}

function startWorkspace(workspace, env) {
  const npmCli = resolveNpmCli();
  console.log(`  ${chalk.dim("-")} Starting ${workspace}\n`);
  return spawn(process.execPath, [npmCli, "run", "dev", "--workspace", workspace], {
    cwd: root,
    env,
    shell: false,
    stdio: "inherit",
  });
}

function resolveNpmCli() {
  const npmCli = process.env.npm_execpath;
  if (npmCli && existsSync(npmCli)) return npmCli;

  const bundledNpmCli = resolve(process.execPath, "..", "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(bundledNpmCli)) return bundledNpmCli;
  throw new Error("Could not locate the npm CLI for startup preflight.");
}

function attachShutdownHandlers(child, release) {
  let stopping = false;
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      if (stopping) return;
      stopping = true;
      stopWorkspace(child, signal, release);
    });
  }
}

function stopWorkspace(child, signal, release) {
  if (child.exitCode !== null) return;
  child.kill(signal);
  if (process.platform !== "win32" || !child.pid) return;

  const timeout = setTimeout(() => {
    if (child.exitCode !== null) return;
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
  }, 5_000);
  timeout.unref();
  child.once("exit", () => {
    clearTimeout(timeout);
    release();
  });
}

async function stopProcessTree(pid) {
  if (process.platform === "win32") {
    await runProcess("taskkill", ["/pid", String(pid), "/t", "/f"]);
    return;
  }

  process.kill(pid, "SIGTERM");
}

function runProcess(command, args) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, args, { stdio: "ignore", windowsHide: true });
    child.once("error", rejectProcess);
    child.once("exit", (code) => {
      if (code === 0) resolveProcess();
      else rejectProcess(new Error(`${command} exited with code ${code ?? "unknown"}.`));
    });
  });
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n  ${chalk.red("x")} ${error.message}\n`);
    process.exitCode = 1;
  });
}
