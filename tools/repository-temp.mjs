import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export function repositoryTempDirectory() {
  const directory = resolve(import.meta.dirname, "../dist/.tmp");
  mkdirSync(directory, { recursive: true });
  return directory;
}
