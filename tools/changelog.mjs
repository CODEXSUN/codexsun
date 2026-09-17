import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const changelogPath = join("assist", "documentation", "CHAGELOG.md");

export function readLatestVersionedChangelogEntry(rootDir) {
  const content = readFileSync(resolve(rootDir, changelogPath), "utf8");
  const match = /^## v-(\d+\.\d+\.(\d+))\s*\r?\n\r?\n### \[v (\d+\.\d+\.\d+)\] .+? - (.+)$/mu.exec(content);
  if (!match) throw new Error("CHAGELOG.md does not contain a valid current version entry.");
  if (match[1] !== match[3]) {
    throw new Error("CHAGELOG.md has different tag and entry versions.");
  }

  return { version: match[1], reference: Number(match[2]), title: match[4].trim() };
}

export function formatChangelogCommitSubject(entry) {
  if (entry.reference < 1) throw new Error("Version 1.0.0 is the baseline. Bump to v-1.0.1 before the first commit.");
  return `#${entry.reference} - ${entry.title}`;
}
