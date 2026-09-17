import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");

export const scopeWorkspaces = {
  platform: [
    "@codexsun/platform-api",
    "@codexsun/platform-web",
    "@codexsun/platform-desktop",
    "@codexsun/platform-mobile",
  ],
  docs: ["@codexsun/docs-api", "@codexsun/docs-web"],
  orship: ["@codexsun/orship-api", "@codexsun/orship-web"],
  zetro: ["@codexsun/zetro-api", "@codexsun/zetro-web"],
  uiux: ["@codexsun/uiux-web"],
  packages: [
    "@codexsun/contracts",
    "@codexsun/docs-contracts",
    "@codexsun/framework",
    "@codexsun/platform-core",
    "@codexsun/ui",
    "@codexsun/zetro-contracts",
  ],
};

const supportedTasks = new Set(["build", "check", "lint"]);

export function createTurboScopeCommand(scope, task, extraArgs = []) {
  if (!scopeWorkspaces[scope]) throw new Error(`Unknown Turbo scope: ${scope}.`);
  if (!supportedTasks.has(task)) throw new Error(`Unsupported Turbo task: ${task}.`);

  const cacheDir = `dist/.turbo/${scope}`;
  const filters = scopeWorkspaces[scope].flatMap((workspace) => ["--filter", `${workspace}...`]);
  return ["exec", "turbo", "--", "run", task, "--cache-dir", cacheDir, ...filters, ...extraArgs];
}

function main() {
  const [scope, task, ...extraArgs] = process.argv.slice(2);
  const command = createTurboScopeCommand(scope, task, extraArgs);
  const turbo = resolve(root, "node_modules", "turbo", "bin", "turbo");

  try {
    execFileSync(process.execPath, [turbo, ...command.slice(3)], { cwd: root, stdio: "inherit" });
  } finally {
    execFileSync(process.execPath, [resolve(root, "tools", "clean-root-layout.mjs")], {
      cwd: root,
      stdio: "inherit",
    });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
