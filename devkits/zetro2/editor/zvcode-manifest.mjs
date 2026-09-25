// ZVcode import manifest and source-diff tool (task 2.4).
// Computes a deterministic aggregate SHA-256 over the imported tree and,
// when the original reference source is present, lists local modifications.
// Usage:
//   node devkits/zetro2/editor/zvcode-manifest.mjs           # summary + aggregate digest
//   node devkits/zetro2/editor/zvcode-manifest.mjs --diff     # also diff vs apps/temp/openvscode-server
//   node devkits/zetro2/editor/zvcode-manifest.mjs --write     # write full manifest to dist/zetro2/

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const editorDir = path.dirname(fileURLToPath(import.meta.url));
const zvcodeRoot = path.resolve(editorDir, "../zvcode");
const upstreamRoot = path.resolve(editorDir, "../../../apps/temp/openvscode-server");
const distDir = path.resolve(editorDir, "../../../dist/zetro2");

const EXCLUDED_DIR_NAMES = new Set([".git", "node_modules"]);

async function walkFiles(root) {
  const files = [];
  async function walk(dir, rel) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
        await walk(path.join(dir, entry.name), relPath);
      } else if (entry.isFile()) {
        files.push(relPath);
      }
    }
  }
  await walk(root, "");
  files.sort();
  return files;
}

async function hashTree(root, { normalizeEol = false } = {}) {
  const files = await walkFiles(root);
  const perFile = new Map();
  const lines = [];
  let totalBytes = 0;
  for (const rel of files) {
    const buf = await readFile(path.join(root, rel));
    totalBytes += buf.length;
    const content = normalizeEol ? Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8") : buf;
    const digest = createHash("sha256").update(content).digest("hex");
    perFile.set(rel, digest);
    lines.push(`${digest}  ${rel}\n`);
  }
  const aggregate = createHash("sha256").update(lines.join("")).digest("hex");
  return { files, perFile, totalBytes, aggregate };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const zv = await hashTree(zvcodeRoot);

  const summary = {
    root: "devkits/zetro2/zvcode",
    fileCount: zv.files.length,
    totalBytes: zv.totalBytes,
    aggregateSha256: zv.aggregate,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  console.log(JSON.stringify(summary, null, 2));

  if (args.has("--write")) {
    await mkdir(distDir, { recursive: true });
    const manifestPath = path.join(distDir, "zvcode-manifest.sha256.txt");
    await writeFile(manifestPath, zv.files.map((rel) => `${zv.perFile.get(rel)}  ${rel}\n`).join(""));
    const summaryPath = path.join(distDir, "zvcode-manifest.summary.json");
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`Wrote ${manifestPath}`);
    console.log(`Wrote ${summaryPath}`);
  }

  if (args.has("--diff")) {
    const sourcePresent = await readdir(upstreamRoot).then(
      () => true,
      () => false,
    );
    if (!sourcePresent) {
      console.error(`Upstream reference not found: ${upstreamRoot}`);
      process.exitCode = 2;
      return;
    }
    // Compare content modulo line endings: the imported tree is git-normalized
    // to LF while the reference clone retains CRLF, which is not a local edit.
    const up = await hashTree(upstreamRoot, { normalizeEol: true });
    const zvNorm = await hashTree(zvcodeRoot, { normalizeEol: true });
    const upSet = new Set(up.files);
    const zvSet = new Set(zvNorm.files);

    const modified = [];
    const added = [];
    const removed = [];
    for (const rel of zvNorm.files) {
      if (!upSet.has(rel)) added.push(rel);
      else if (up.perFile.get(rel) !== zvNorm.perFile.get(rel)) modified.push(rel);
    }
    for (const rel of up.files) {
      if (!zvSet.has(rel)) removed.push(rel);
    }

    const diffReport = {
      upstreamRoot: "apps/temp/openvscode-server",
      upstreamFileCount: up.files.length,
      upstreamAggregateSha256: up.aggregate,
      zvcodeNormalizedAggregateSha256: zvNorm.aggregate,
      modifiedCount: modified.length,
      addedCount: added.length,
      removedCount: removed.length,
      modified,
      added,
      removed,
    };
    await mkdir(distDir, { recursive: true });
    const diffPath = path.join(distDir, "zvcode-upstream-diff.json");
    await writeFile(diffPath, `${JSON.stringify(diffReport, null, 2)}\n`);
    console.log(JSON.stringify(diffReport, null, 2));
    console.log(`Wrote ${diffPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
