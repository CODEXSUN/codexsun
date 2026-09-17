#!/usr/bin/env node

import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
    envKey: "UIUX_WEB_PORT",
    workspace: "@codexsun/uiux-web",
  },
};

export class StartupPreflight {
  constructor(target, env) {
    this.target = target;
    this.env = env;
    this.host = parseRequiredHost(env.PLATFORM_HOST);
    this.port = parseRequiredPort(env[target.envKey], target.envKey);
    this.reservation = new PortReservation(root, this.port, target.workspace);
  }

  async check() {
    console.log(`\n  > ${this.target.displayName} preflight`);
    console.log(`  - Checking ${this.host}:${this.port}`);
    await this.reservation.acquire();

    try {
      await assertPortAvailable(this.host, this.port);
      console.log(`  ok Reserved ${this.host}:${this.port}\n`);
    } catch (error) {
      this.reservation.release();
      throw error;
    }
  }

  async start() {
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
  if (!target || (mode && mode !== "--check")) {
    throw new Error(`Usage: node tools/preflight.mjs <${Object.keys(targets).join("|")}> [--check]`);
  }

  const preflight = new StartupPreflight(target, loadEnvironment(targetName));
  if (mode === "--check") {
    await preflight.check();
    preflight.reservation.release();
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
  const app = targetName === "uiux-web" ? "uiux" : "platform";
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

function parseRequiredHost(value) {
  const host = String(value ?? "").trim();
  if (!host) throw new Error("Set PLATFORM_HOST in .env or the app .app.env file.");
  return host;
}

async function assertPortAvailable(host, port) {
  if (await canBind(host, port)) return;
  throw new Error(`Port ${port} is already in use. Stop its verified owner or choose another configured port.`);
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
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  console.log(`  - Starting ${workspace}\n`);
  return spawn(command, ["run", "dev", "--workspace", workspace], {
    cwd: root,
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}

function attachShutdownHandlers(child, release) {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      release();
      child.kill(signal);
    });
  }
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
    console.error(`\n  x ${error.message}\n`);
    process.exitCode = 1;
  });
}
