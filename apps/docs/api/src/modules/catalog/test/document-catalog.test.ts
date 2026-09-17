import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DocumentCatalog } from "../service/document-catalog.js";
import { discoverDocuments, resolveInsideRoot } from "../service/document-source.js";

test("indexes only allowed Markdown roots and removes stale records", () => {
  const root = mkdtempSync(join(tmpdir(), "codexsun-docs-"));
  try {
    writeFileSync(join(root, "README.md"), "# Root\n");
    mkdirSync(join(root, "assist"));
    writeFileSync(join(root, "assist", "guide.md"), "# Guide\n");
    mkdirSync(join(root, "apps", "sample"), { recursive: true });
    writeFileSync(join(root, "apps", "sample", "README.md"), "# Sample\n");
    mkdirSync(join(root, "node_modules", "blocked"), { recursive: true });
    writeFileSync(join(root, "node_modules", "blocked", "README.md"), "# Blocked\n");

    const catalog = new DocumentCatalog({ indexPath: "storage/docs.sqlite", repositoryRoot: root });
    assert.deepEqual(catalog.sync(), { changed: 3, discovered: 3, removed: 0, unchanged: 0 });
    assert.deepEqual(catalog.sync(), { changed: 0, discovered: 3, removed: 0, unchanged: 3 });
    rmSync(join(root, "assist", "guide.md"));
    assert.deepEqual(catalog.sync(), { changed: 0, discovered: 2, removed: 1, unchanged: 2 });
    catalog.close();
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("rejects paths outside the repository root", () => {
  assert.throws(() => resolveInsideRoot("C:/docs", "../secret.md"), /outside the repository root/u);
});

test("discovers MDX only inside Docs content", () => {
  const root = mkdtempSync(join(tmpdir(), "codexsun-docs-"));
  try {
    mkdirSync(join(root, "apps", "docs", "content"), { recursive: true });
    writeFileSync(join(root, "apps", "docs", "content", "guide.mdx"), "# Guide\n");
    writeFileSync(join(root, "apps", "guide.mdx"), "# Ignored\n");
    assert.deepEqual(
      discoverDocuments(root).map((document) => document.path),
      ["apps/docs/content/guide.mdx"],
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
