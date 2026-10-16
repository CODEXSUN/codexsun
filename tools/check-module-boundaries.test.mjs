import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { repositoryTempDirectory } from "./repository-temp.mjs";

test("reduced modules retain required roles and explicit capability declarations", () => {
  const root = resolve(import.meta.dirname, "..");
  const fixture = mkdtempSync(join(repositoryTempDirectory(), "boundary-contract-"));
  assert.ok(fixture.startsWith(join(root, "dist")));
  try {
    const modules = join(fixture, "apps/hrms/api/src/modules");
    cpSync(join(root, "apps/hrms/api/src/modules"), modules, { recursive: true });
    const check = () =>
      spawnSync(process.execPath, [join(root, "tools/check-module-boundaries.mjs"), "hrms"], {
        cwd: fixture,
        encoding: "utf8"
      });
    assert.equal(check().status, 0);
    const definition = join(modules, "attendance/attendance.module.ts");
    const original = readFileSync(definition, "utf8");
    writeFileSync(definition, original.replace("worker: false", "worker: true"));
    assert.match(check().stderr, /explicit synchronous capabilities/u);
    writeFileSync(definition, original);
    rmSync(join(modules, "attendance/attendance.service.ts"));
    assert.match(check().stderr, /missing attendance.service.ts/u);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
