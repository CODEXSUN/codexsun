import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { FilesystemTools } from "../filesystem-tools.js";

test("filesystem tools provide bounded read-only and sandboxed mutation operations", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "workspace-test-"));
  const tools = new FilesystemTools(root, "read-write");
  try {
    await tools.write("src/example.txt", "alpha\nbeta\n");
    assert.equal((await tools.exists("src/example.txt")).exists, true);
    assert.equal((await tools.stat("src/example.txt")).kind, "file");
    assert.equal((await tools.read("src/example.txt")).content, "alpha\nbeta\n");
    assert.equal((await tools.search("beta")).matches[0].line, 2);
    await tools.edit("src/example.txt", [{ search: "alpha", replace: "one" }]);
    await tools.patch([{ path: "src/example.txt", edits: [{ search: "beta", replace: "two" }] }]);
    assert.equal((await tools.read("src/example.txt")).content, "one\ntwo\n");
    await tools.copy("src/example.txt", "src/copied.txt");
    await tools.move("src/copied.txt", "src/moved.txt");
    assert.equal((await tools.list("src", false)).items.length, 2);
    await tools.remove("src/moved.txt", false, true);
    assert.equal((await tools.exists("src/moved.txt")).exists, false);
    await assert.rejects(tools.read("../package.json"), /outside the configured root/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("read-only sandbox blocks every mutation tool", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "workspace-test-"));
  const tools = new FilesystemTools(root);
  try {
    await assert.rejects(tools.write("file.txt", "blocked"), /mutations are disabled/u);
    await assert.rejects(tools.edit("file.txt", [{ search: "a", replace: "b" }]), /mutations are disabled/u);
    await assert.rejects(tools.patch([{ path: "file.txt", edits: [{ search: "a", replace: "b" }] }]), /mutations are disabled/u);
    await assert.rejects(tools.remove("file.txt", false, true), /mutations are disabled/u);
    await assert.rejects(tools.move("a", "b"), /mutations are disabled/u);
    await assert.rejects(tools.copy("a", "b"), /mutations are disabled/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
