import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function findWorkspaceRoot(startDir: string = resolve(".")): string {
  let curr = resolve(startDir);
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(curr, "turbo.json")) || existsSync(resolve(curr, ".agents"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(startDir);
}
