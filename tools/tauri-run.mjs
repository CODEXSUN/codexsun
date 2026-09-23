import { spawn } from "node:child_process";
import { dirname, relative, resolve } from "node:path";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "build") throw new Error("Use tauri-run with dev or build.");

const root = resolve(import.meta.dirname, "..");
const hostDirectory = process.cwd();
const ownerDirectory = relative(root, dirname(hostDirectory));
if (!ownerDirectory || ownerDirectory.startsWith("..")) throw new Error("Tauri host must run inside a registered repository owner.");
const command = process.platform === "win32" ? "npm.cmd" : "npm";
const argumentsForMode = ["exec", "tauri", "--", mode];
if (mode === "build") argumentsForMode.push("--no-bundle");

const child = spawn(command, argumentsForMode, {
  cwd: process.cwd(),
  env: { ...process.env, CARGO_TARGET_DIR: resolve(root, "dist", ownerDirectory, "desktop", "target") },
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.once("exit", (code) => process.exit(code ?? 1));
