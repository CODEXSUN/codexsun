import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { applications } from "./config.mjs";
import { readJson } from "./files.mjs";

export async function currentRelease(base, model, checksum) {
  const candidates = (await readdir(base))
    .filter((name) => /^\d+-[a-f0-9]+$/u.test(name))
    .sort()
    .reverse();
  for (const name of candidates) {
    const directory = join(base, name);
    try {
      const result = await readJson(join(directory, "result.json"));
      if (
        !result.success &&
        (result.databaseChangesPossible || existsSync(join(directory, "reuse-attempt.json")))
      )
        return null;
      // A no-op cannot establish a new recovery point or hide an earlier failure.
      if (result.noChanges) continue;
      if (!result.success || result.sourceChecksum !== checksum) continue;
      const previous = await readJson(join(directory, "candidate.private.json"));
      if (
        applications.every(
          (application) =>
            previous.services[application].image === model.services[application].image
        )
      )
        return directory;
    } catch {
      if (
        ["master-startup-proof.log", "migrations-run.log", "seed.log", "reuse-attempt.json"].some(
          (file) => existsSync(join(directory, file))
        )
      )
        return null;
    }
  }
  return null;
}
