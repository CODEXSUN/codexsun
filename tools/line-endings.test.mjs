import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { checkLineEndings, fixLineEndings } from "./line-endings.mjs";

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "codexsun-line-endings-"));
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  return root;
}

test("reports and fixes CRLF text without changing binary files", () => {
  const root = createFixture();
  const sourcePath = join(root, "source.ts");
  const binaryPath = join(root, "image.png");
  const binary = Buffer.from([0, 13, 10, 255]);

  try {
    writeFileSync(sourcePath, "export const value = 1;\r\n");
    writeFileSync(binaryPath, binary);

    assert.deepEqual(checkLineEndings(root), ["source.ts: CRLF"]);
    assert.deepEqual(fixLineEndings(root), ["source.ts"]);
    assert.deepEqual(checkLineEndings(root), []);
    assert.equal(readFileSync(sourcePath, "utf8"), "export const value = 1;\n");
    assert.deepEqual(readFileSync(binaryPath), binary);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
