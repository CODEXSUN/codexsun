import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

export function apiSourceDirectories(root) {
  const directories = [];
  for (const workspaceGroup of ["apps", "devkits", "packages"]) {
    const groupPath = join(root, workspaceGroup);
    if (!existsSync(groupPath)) continue;
    for (const entry of readdirSync(groupPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = join(groupPath, entry.name, "api", "src");
      if (existsSync(directory)) directories.push(directory);
    }
  }
  return directories;
}

export async function captureApiInputs(root) {
  const files = new Map();
  for (const directory of apiSourceDirectories(root))
    await captureDirectory(root, directory, files);
  await captureFile(root, join(root, ".env"), files);
  return files;
}

export function changedApiInputs(previous, current) {
  return [...new Set([...previous.keys(), ...current.keys()])]
    .filter((path) => previous.get(path) !== current.get(path))
    .sort();
}

async function captureDirectory(root, directory, files) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await captureDirectory(root, path, files);
    else if (entry.isFile()) await captureFile(root, path, files);
  }
}

async function captureFile(root, path, files) {
  try {
    const content = await readFile(path);
    files.set(
      relative(root, path).replaceAll("\\", "/"),
      createHash("sha256").update(content).digest("hex")
    );
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
