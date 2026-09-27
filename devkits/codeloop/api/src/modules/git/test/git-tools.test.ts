import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { GitTools } from "../git-tools.js";

function git(root: string, args: string[]): string { return execFileSync("git", args, { cwd: root, encoding: "utf8" }); }

test("git tools provide bounded status, history, branches, checkpoint, rollback, and task commit", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "git-tools-test-"));
  try {
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.name", "CodeLoop Test"]);
    git(root, ["config", "user.email", "codeloop-test@example.invalid"]);
    await writeFile(resolve(root, "README.md"), "initial\n");
    const tools = new GitTools(root, true);
    tools.add(["README.md"], true);
    tools.commit("initial", true);
    assert.equal(tools.status().clean, true);
    assert.ok(tools.log(5).commits.length >= 1);
    const branches = tools.branch("list");
    assert.ok(branches.branches?.includes("main"));
    const checkpoint = tools.createCheckpoint(true);
    await writeFile(resolve(root, "README.md"), "changed\n");
    assert.equal(tools.status().clean, false);
    tools.rollback(checkpoint.id, true);
    assert.equal(tools.status().clean, true);
    assert.equal(tools.branch("create", "agent/test", true).branch, "agent/test");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("git mutations require explicit confirmation and read-write mode", async () => {
  const root = await mkdtemp(resolve(process.cwd(), "git-tools-test-"));
  try {
    git(root, ["init"]);
    assert.throws(() => new GitTools(root).add(["file.txt"], true), /mutations are disabled/u);
    assert.throws(() => new GitTools(root, true).add(["file.txt"]), /confirm=true/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
