import { existsSync, lstatSync, mkdirSync, realpathSync, symlinkSync } from "node:fs";
import { resolve, join } from "node:path";

export function prepareNativeOutput(app) {
  const hosts = { windows: "platform/windows", qcafe: "qcafe/desktop" };
  if (!hosts[app]) throw new Error("Unknown native host.");
  const root = resolve(import.meta.dirname, "..");
  const target = join(root, "dist", ".cache", "tauri", app, "gen");
  const source = join(root, "apps", hosts[app], "src-tauri", "gen");
  mkdirSync(target, { recursive: true });
  if (!existsSync(source))
    symlinkSync(target, source, process.platform === "win32" ? "junction" : "dir");
  if (!lstatSync(source).isSymbolicLink() || realpathSync(source) !== realpathSync(target))
    throw new Error(`Move generated Tauri schemas into root dist before building: ${source}`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename)
  prepareNativeOutput(process.argv[2]);
