#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const BINARY_EXTENSIONS = new Set([
  ".7z",
  ".aab",
  ".apk",
  ".dll",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".icns",
  ".ipa",
  ".jpeg",
  ".jpg",
  ".msi",
  ".p12",
  ".pdf",
  ".pfx",
  ".png",
  ".webp",
  ".zip",
]);

export function checkLineEndings(root = ROOT) {
  return collectTextFiles(root).flatMap((file) => describeViolation(root, file));
}

export function fixLineEndings(root = ROOT) {
  const changedFiles = [];

  for (const file of collectTextFiles(root)) {
    const path = resolve(root, file);
    const source = readFileSync(path, "utf8");
    const normalized = source.replace(/\r\n?/g, "\n");

    if (normalized !== source) {
      writeFileSync(path, normalized, "utf8");
      changedFiles.push(file);
    }
  }

  return changedFiles;
}

function collectTextFiles(root) {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);

  return files.filter((file) => existsSync(resolve(root, file)) && isTextFile(resolve(root, file), file));
}

function describeViolation(root, file) {
  const source = readFileSync(resolve(root, file), "utf8");
  if (!source.includes("\r")) return [];

  const hasCrlf = source.includes("\r\n");
  const hasLf = /(?<!\r)\n/.test(source);
  const kind = hasCrlf && hasLf ? "mixed LF and CRLF" : hasCrlf ? "CRLF" : "CR";
  return [`${file}: ${kind}`];
}

function isTextFile(path, file) {
  const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (BINARY_EXTENSIONS.has(extension)) return false;

  return !readFileSync(path).includes(0);
}

function main() {
  const command = process.argv[2] ?? "check";
  if (!new Set(["check", "fix"]).has(command)) {
    throw new Error("Use check or fix.");
  }

  const changedFiles = command === "fix" ? fixLineEndings() : [];
  const violations = checkLineEndings();
  if (violations.length > 0) {
    throw new Error(`Text files must use LF endings:\n${violations.join("\n")}`);
  }

  console.log(
    changedFiles.length > 0
      ? `Normalized LF endings in ${changedFiles.length} text file(s).`
      : "Text file line endings are valid.",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`\n  Error: ${error.message}\n`);
    process.exit(1);
  }
}
