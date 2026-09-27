import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { CodeIntelligence } from "../../workspace/code-intelligence.js";
import { CodeTools } from "../../workspace/code-tools.js";
import { FilesystemTools } from "../../workspace/filesystem-tools.js";
import { GitTools } from "../../git/git-tools.js";
import { TerminalTools } from "../../terminal/terminal-tools.js";
import { TestTools } from "../../test/test-tools.js";
import { ValidationTools } from "../../validation/validation-tools.js";
import { BrowserTools } from "../../browser/browser-tools.js";
import { ProcessTools } from "../../process/process-tools.js";
import { SandboxTools } from "../../sandbox/sandbox-tools.js";
import { DependencyTools } from "../../dependency/dependency-tools.js";
import { ProjectTools } from "../../project/project-tools.js";
import { MemoryTools } from "../../memory/memory-tools.js";
import { AgentToolRegistry } from "../tool-registry.js";

test("agent mutations pause for human approval before execution", async () => {
  const root = process.cwd();
  const registry = new AgentToolRegistry(
    new FilesystemTools(root, "read-write"),
    new TerminalTools(root),
    new GitTools(root, true),
    new CodeTools(new FilesystemTools(root, "read-write")),
    new CodeIntelligence(new FilesystemTools(root, "read-write")),
    new TestTools(new TerminalTools(root)),
    new ValidationTools(new TerminalTools(root)),
    new BrowserTools(root),
    new ProcessTools(new TerminalTools(root)),
    new SandboxTools(root, "docker-not-used-by-this-test"),
    new DependencyTools(root),
    new ProjectTools(root),
    new MemoryTools("json", join(tmpdir(), "codeloop-memory-registry-test.json")),
  );
  const names = registry.definitions().map((definition) => definition.function.name);
  assert.deepEqual(names.filter((name) => name.startsWith("test.")), ["test.run", "test.unit", "test.integration", "test.e2e", "test.watch", "test.coverage"]);
  assert.equal(names.includes("validate"), true);
  assert.deepEqual(names.filter((name) => name.startsWith("process.")), ["process.start", "process.stop", "process.restart", "process.status", "process.logs"]);
  assert.deepEqual(names.filter((name) => name.startsWith("sandbox.")), ["sandbox.create", "sandbox.start", "sandbox.exec", "sandbox.stop", "sandbox.destroy", "sandbox.snapshot", "sandbox.restore"]);
  assert.deepEqual(names.filter((name) => name.startsWith("package.")), ["package.install", "package.remove", "package.update", "package.inspect", "package.audit"]);
  assert.deepEqual(names.filter((name) => name.startsWith("project.")), ["project.scan", "project.index", "project.structure", "project.dependencies", "project.conventions", "project.architecture"]);
  assert.deepEqual(names.filter((name) => name.startsWith("memory.")), ["memory.task_state", "memory.project_state", "memory.decisions"]);
  assert.equal(names.includes("fs.move"), true);
  assert.equal(names.includes("fs.copy"), true);
  assert.equal(names.includes("code.ast"), true);
  assert.deepEqual(names.filter((name) => name.startsWith("git.")), ["git.status", "git.diff", "git.log", "git.branch", "git.checkout", "git.add", "git.commit", "git.create_checkpoint", "git.reset", "git.stash", "git.rollback", "git.create_agent_branch", "git.commit_task"]);

  const event = await registry.execute({ id: "approval-1", name: "fs.write", arguments: { path: "approval-test.txt", content: "must not be written" } });
  assert.equal(event.status, "approval_required");
  assert.deepEqual(event.result, { approvalRequired: true, message: "Human approval is required before this operation." });
});
