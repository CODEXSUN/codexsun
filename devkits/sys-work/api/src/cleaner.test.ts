import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Cleaner } from "./cleaner.js";
import type { CleanerTarget } from "./catalog.js";

test("scan selects aged files and clean preserves changed and unapproved files", async () => {
  const home = await mkdtemp(join(tmpdir(), "codexsun-sys-work-"));
  try {
    const cache = join(home, "cache");
    await mkdir(cache);
    const old = join(cache, "old.bin");
    const changed = join(cache, "changed.bin");
    const recent = join(cache, "recent.bin");
    const privateFile = join(home, "history.db");
    for (const path of [old, changed, recent, privateFile]) await writeFile(path, "data");
    const oldDate = new Date(Date.now() - 10 * 86_400_000);
    await utimes(old, oldDate, oldDate);
    await utimes(changed, oldDate, oldDate);
    const targets: CleanerTarget[] = [
      {
        id: "test-cache",
        group: "Codex",
        label: "Test",
        detail: "Test",
        roots: async () => [cache]
      }
    ];
    const cleaner = new Cleaner(home, targets);
    const scan = await cleaner.scan(7);
    assert.equal(scan.rows[0]?.files, 2);
    await writeFile(changed, "changed since preview");
    const result = await cleaner.clean(scan.scanId, ["test-cache"]);
    assert.equal(result.deletedFiles, 1);
    assert.equal(result.skippedFiles, 1);
    await assert.rejects(readFile(old));
    assert.equal(await readFile(changed, "utf8"), "changed since preview");
    assert.equal(await readFile(recent, "utf8"), "data");
    assert.equal(await readFile(privateFile, "utf8"), "data");
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test("scan does not follow links outside approved cache roots", async () => {
  const home = await mkdtemp(join(tmpdir(), "codexsun-sys-work-"));
  try {
    const cache = join(home, "cache");
    const outside = join(home, "outside");
    await mkdir(cache);
    await mkdir(outside);
    await writeFile(join(outside, "keep.bin"), "safe");
    await symlink(outside, join(cache, "link"), "junction");
    const targets: CleanerTarget[] = [
      {
        id: "test-cache",
        group: "Codex",
        label: "Test",
        detail: "Test",
        roots: async () => [cache]
      }
    ];
    const cleaner = new Cleaner(home, targets);
    const scan = await cleaner.scan(0);
    assert.equal(scan.rows[0]?.files, 0);
    assert.equal(await readFile(join(outside, "keep.bin"), "utf8"), "safe");
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
