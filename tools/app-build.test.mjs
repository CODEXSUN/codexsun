import assert from "node:assert/strict";
import test from "node:test";
import { createAppBuildCommand } from "./app-build.mjs";

test("build command delegates an application scope to Turbo", () => {
  const command = createAppBuildCommand("qcafe");

  assert.match(command[0], /tools[\\/]turbo-scope\.mjs$/u);
  assert.deepEqual(command.slice(1), ["qcafe", "build"]);
});

test("build command rejects an unknown application scope", () => {
  assert.throws(() => createAppBuildCommand("unknown"), /Unknown application/u);
});
