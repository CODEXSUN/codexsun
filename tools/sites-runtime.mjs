#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runtimes = {
  codexsun: { port: 7001, origin: "http://127.0.0.1:7001" },
  devxcrew: { port: 7002, origin: "http://127.0.0.1:7002" },
  logicx: { port: 7003, origin: "http://127.0.0.1:7003" },
  skilloopz: { port: 7004, origin: "http://127.0.0.1:7004" },
};

const [slug, command = "dev"] = process.argv.slice(2);
const runtime = runtimes[slug];
if (!runtime || !["dev", "build"].includes(command)) {
  throw new Error(`Usage: node tools/sites-runtime.mjs <codexsun|devxcrew|logicx|skilloopz> [dev|build]`);
}

const npmCli = process.env.npm_execpath && existsSync(process.env.npm_execpath)
  ? process.env.npm_execpath
  : resolve(process.execPath, "..", "node_modules", "npm", "bin", "npm-cli.js");
const env = {
  ...process.env,
  SITES_WEB_PORT: String(runtime.port),
  VITE_SITES_CLIENT_SLUG: slug,
  VITE_SITES_PUBLIC_URL: runtime.origin,
  VITE_SITES_API_URL: process.env.VITE_SITES_API_URL ?? "http://127.0.0.1:6260",
};

const child = spawn(process.execPath, [npmCli, "run", command, "--workspace", "@codexsun/sites-web"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: false,
});
child.on("exit", (code, signal) => process.exitCode = code ?? (signal ? 1 : 0));
