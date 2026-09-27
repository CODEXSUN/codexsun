import assert from "node:assert/strict";
import test from "node:test";
import { ProjectTools } from "./project-tools.js";

test("project tools build a bounded knowledge graph and query conventions", async () => {
  const tools = new ProjectTools(process.cwd());
  const scan = await tools.scan();
  assert.equal(scan.root, process.cwd());
  assert.equal(Number(scan.summary.fileCount) > 0, true);
  assert.equal(scan.nodes.some((node) => node.type === "project"), true);
  assert.equal(scan.nodes.some((node) => node.type === "config"), true);

  const structure = await tools.structure();
  assert.equal(structure.tree.name, ".");
  const dependencies = await tools.dependencies();
  assert.equal(["npm", "pnpm", "yarn", "bun"].includes(dependencies.packageManager), true);
  const conventions = await tools.conventions();
  assert.equal(typeof conventions.sourceExtensions, "object");
  const architecture = await tools.architecture();
  assert.equal(architecture.relationships.length > 0, true);
});
