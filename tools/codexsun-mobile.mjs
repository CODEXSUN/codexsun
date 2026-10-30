import { prepareMobileOutput } from "./mobile-output.mjs";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appRoot = join(root, "apps/codexsun/mobile");
const mobileEnvironment = prepareMobileOutput(root, "codexsun");
const [command, ...extra] = process.argv.slice(2);
const commands = {
  analyze: ["analyze"],
  test: ["test"],
  run: ["run"],
  "build-debug": ["build", "apk", "--debug"]
};
if (!commands[command]) throw new Error("Use analyze, test, run, or build-debug.");
const flutter =
  process.env.CODEXSUN_FLUTTER_BIN ||
  (platform() === "win32" ? join(homedir(), "development/flutter/bin/flutter.bat") : "flutter");
if (platform() === "win32" && !existsSync(flutter))
  throw new Error("Set CODEXSUN_FLUTTER_BIN to Flutter.");
const args = [...commands[command], ...extra];
if (platform() === "win32" && [flutter, ...args].some((value) => /[\r\n&|<>^%"!]/u.test(value)))
  throw new Error("Flutter paths and arguments must not contain shell control characters.");
const windowsCommand = [flutter, ...args].map((value) => `"${value}"`).join(" ");
const result =
  platform() === "win32"
    ? spawnSync(
        process.env.ComSpec || "cmd.exe",
        ["/d", "/v:off", "/s", "/c", `"${windowsCommand}"`],
        {
          cwd: appRoot,
          env: { ...process.env, ...mobileEnvironment },
          windowsVerbatimArguments: true,
          stdio: "inherit"
        }
      )
    : spawnSync(flutter, args, {
        cwd: appRoot,
        env: { ...process.env, ...mobileEnvironment },
        stdio: "inherit"
      });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
