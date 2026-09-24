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
    const source = readFileSync(path);
    const normalized = normalizeLineEndingBytes(source);

    if (!normalized.equals(source)) {
      writeFileSync(path, normalized);
      changedFiles.push(file);
    }
  }

  return changedFiles;
}

function collectTextFiles(root) {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  })
    .split("\n")
    .filter(Boolean);

  return files.filter((file) => existsSync(resolve(root, file)) && isTextFile(resolve(root, file), file));
}

function describeViolation(root, file) {
  const source = readFileSync(resolve(root, file));
  if (!source.includes(0x0d)) return [];

  const hasCrlf = source.includes(Buffer.from([0x0d, 0x0a]));
  const hasLf = source.some((value, index) => value === 0x0a && source[index - 1] !== 0x0d);
  const kind = hasCrlf && hasLf ? "mixed LF and CRLF" : hasCrlf ? "CRLF" : "CR";
  return [`${file}: ${kind}`];
}

function normalizeLineEndingBytes(source) {
  const normalized = Buffer.allocUnsafe(source.length);
  let writeIndex = 0;

  for (let readIndex = 0; readIndex < source.length; readIndex += 1) {
    const value = source[readIndex];
    if (value === 0x0d) {
      if (source[readIndex + 1] === 0x0a) readIndex += 1;
      normalized[writeIndex] = 0x0a;
    } else {
      normalized[writeIndex] = value;
    }
    writeIndex += 1;
  }

  return normalized.subarray(0, writeIndex);
}

function isTextFile(path, file) {
  const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (BINARY_EXTENSIONS.has(extension)) return false;

  const source = readFileSync(path);
  if (source.includes(0)) return false;

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(source);
    return true;
  } catch {
    return false;
  }
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
