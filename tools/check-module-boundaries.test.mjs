import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkModuleBoundaries } from "./check-module-boundaries.mjs";

function fixture() {
  return mkdtempSync(join(tmpdir(), "codexsun-boundaries-"));
}

function module(root, name, source = "") {
  const path = join(root, "apps", "demo", "api", "src", "modules", name);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, "README.md"), "# Test\n");
  writeFileSync(join(path, "provider.ts"), `export const provider = { owner: "apps/demo/api/modules/${name}" };\n`);
  if (source) writeFileSync(join(path, "service.ts"), source);
}

test("accepts module providers and owned imports", () => {
  const root = fixture();
  try {
    module(root, "alpha", 'import "./provider.js";\n');
    assert.deepEqual(checkModuleBoundaries(root), ["apps/demo/api/src/modules/alpha"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a private import from another module", () => {
  const root = fixture();
  try {
    module(root, "alpha");
    module(root, "beta", 'import "../alpha/service.js";\n');
    assert.throws(() => checkModuleBoundaries(root), /imports private module path/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a missing provider or invalid owner", () => {
  const root = fixture();
  try {
    const path = join(root, "apps", "demo", "api", "src", "modules", "alpha");
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, "README.md"), "# Test\n");
    assert.throws(() => checkModuleBoundaries(root), /missing root provider/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
