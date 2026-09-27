import assert from "node:assert/strict";
import test from "node:test";
import { DependencyTools } from "./dependency-tools.js";

test("dependency tools inspect the workspace and detect a supported manager", async () => {
  const tools = new DependencyTools(process.cwd());
  const result = await tools.inspect();
  assert.equal(["npm", "pnpm", "yarn", "bun"].includes(result.manager), true);
  assert.equal(typeof result.manifest.name, "string");
  assert.equal(result.cwd, process.cwd());
});

test("dependency tools reject unsafe package specifications and workspaces", async () => {
  const tools = new DependencyTools(process.cwd());
  await assert.rejects(tools.inspect(".."), /outside the CodeLoop workspace/u);
  await assert.rejects(tools.install(["left-pad;evil"]), /Invalid package specification/u);
});
