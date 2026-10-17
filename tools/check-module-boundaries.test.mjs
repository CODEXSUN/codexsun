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

test("TConnect member roles remain executable and synchronous capabilities stay explicit", () => {
  const root = resolve(import.meta.dirname, "..");
  const fixture = mkdtempSync(join(repositoryTempDirectory(), "tconnect-boundary-"));
  assert.ok(fixture.startsWith(join(root, "dist")));
  try {
    for (const part of ["api", "web"])
      cpSync(
        join(root, `apps/tconnect/${part}/src/modules`),
        join(fixture, `apps/tconnect/${part}/src/modules`),
        { recursive: true }
      );
    const check = () =>
      spawnSync(process.execPath, [join(root, "tools/check-module-boundaries.mjs"), "tconnect"], {
        cwd: fixture,
        encoding: "utf8"
      });
    assert.equal(check().status, 0);
    const definition = join(fixture, "apps/tconnect/api/src/modules/member/member.module.ts");
    const original = readFileSync(definition, "utf8");
    writeFileSync(definition, original.replace(/worker:\s*false/u, "worker: true"));
    assert.match(check().stderr, /explicit synchronous capabilities/u);
    writeFileSync(definition, original);
    const registration = join(
      fixture,
      "apps/tconnect/web/src/modules/member/member.registration.tsx"
    );
    writeFileSync(registration, 'export { TconnectMemberWorkspace } from "./member.workspace";');
    assert.match(check().stderr, /registration role/u);
    rmSync(registration);
    assert.match(check().stderr, /missing member.registration.tsx/u);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
