import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { RepositoryCacheCleanup } from "./clean-repository-cache.mjs";
import { repositoryTempDirectory } from "./repository-temp.mjs";

function fixture(run) {
  const temporary = repositoryTempDirectory();
  const root = mkdtempSync(join(temporary, "cache-cleanup-"));
  assert.ok(root.startsWith(temporary + sep));
  const put = (path, value = path) => {
    const fullPath = join(root, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, value);
  };
  put("package.json", JSON.stringify({ name: "codexsun" }));
  try {
    run(root, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("cleanup preserves every cache while a development launcher is alive", () => {
  fixture((root, put) => {
    put("dist/.cache/keep.txt");
    put(`dist/.tmp/codexsun-dev-preflight-${process.pid}.json`, JSON.stringify({ pid: process.pid }));
    const cleanup = new RepositoryCacheCleanup(root);
    assert.ok(cleanup.run(true).removed.includes("dist/.cache"));
    assert.throws(() => cleanup.run(), /Stop development services/u);
    assert.ok(existsSync(join(root, "dist/.cache/keep.txt")));
    assert.ok(existsSync(join(root, `dist/.tmp/codexsun-dev-preflight-${process.pid}.json`)));
  });
});

test("cleanup removes only listed caches and preserves outputs, dependencies, data and sources", () => {
  fixture((root, put) => {
    const caches = [
      "dist/.cache",
      "dist/.tmp",
      "node_modules/.cache",
      "node_modules/.vite",
      "node_modules/.vite-temp"
    ];
    const protectedFiles = [
      "dist/apps/platform/web/index.html",
      "dist/packages/framework/index.js",
      "dist/releases/app.zip",
      "node_modules/typescript/package.json",
      "storage/site.sqlite",
      "apps/example/source.ts",
      "package-lock.json"
    ];
    for (const path of caches) put(`${path}/nested/cache.bin`);
    for (const path of protectedFiles) put(path);
    const cleanup = new RepositoryCacheCleanup(root);
    assert.equal(cleanup.run(true).removed.length, caches.length);
    for (const path of caches) assert.ok(existsSync(join(root, path)));
    assert.deepEqual(cleanup.run().failures, []);
    for (const path of caches) assert.equal(existsSync(join(root, path)), false);
    for (const path of protectedFiles) assert.equal(readFileSync(join(root, path), "utf8"), path);
    assert.deepEqual(cleanup.run(), { removed: [], failures: [] });
    assert.throws(() => cleanup.validate(join(root, "dist/apps")), /allowlist/u);
  });
});

test("cleanup refuses linked parents, targets and descendants before deleting another cache", () => {
  for (const link of ["dist", "dist/.cache", "dist/.cache/nested"]) {
    fixture((root, put) => {
      put("node_modules/.cache/keep.txt");
      put("storage/protected.txt");
      const path = join(root, link);
      mkdirSync(dirname(path), { recursive: true });
      symlinkSync(join(root, "storage"), path, process.platform === "win32" ? "junction" : "dir");
      assert.throws(() => new RepositoryCacheCleanup(root).run(), /link or junction/u);
      assert.ok(existsSync(join(root, "node_modules/.cache/keep.txt")));
      assert.ok(existsSync(join(root, "storage/protected.txt")));
    });
  }
});

test("cleanup refuses a wrong repository identity and CLI path arguments", () => {
  fixture((root, put) => {
    put("package.json", JSON.stringify({ name: "another-repository" }));
    assert.throws(() => new RepositoryCacheCleanup(root), /repository root/u);
  });
  const result = spawnSync(
    process.execPath,
    [resolve(import.meta.dirname, "clean-repository-cache.mjs"), "dist/apps"],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Arbitrary paths/u);
});
