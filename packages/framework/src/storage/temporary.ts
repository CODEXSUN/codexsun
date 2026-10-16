import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export function repositoryTemporaryDirectory() {
  // Source and compiled framework storage folders are both four levels below the root.
  const directory = resolve(import.meta.dirname, "../../../..", "dist/.tmp");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  return directory;
}
