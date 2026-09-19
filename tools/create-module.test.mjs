import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createModule } from "./create-module.mjs";

function createFixture() {
  return mkdtempSync(join(tmpdir(), "codexsun-module-"));
}

test("creates one owned module template", () => {
  const root = createFixture();
  try {
    const modulePath = createModule({
      rootDir: root,
      target: "apps/demo/api/src/modules",
      moduleName: "settings",
      moduleId: "demo.settings",
      owner: "apps/demo/api",
    });

    assert.equal(existsSync(join(modulePath, "provider.ts")), true);
    assert.equal(existsSync(join(modulePath, "controller/.gitkeep")), true);
    assert.match(readFileSync(join(modulePath, "test/README.md"), "utf8"), /Fastify inject/u);
    assert.equal(existsSync(join(modulePath, "services/.gitkeep")), true);
    assert.match(readFileSync(join(modulePath, "provider.ts"), "utf8"), /demo\.settings/u);
    assert.match(readFileSync(join(modulePath, "provider.ts"), "utf8"), /published: \[\], consumed: \[\]/u);
    assert.throws(
      () =>
        createModule({
          rootDir: root,
          target: "apps/demo/api/src/modules",
          moduleName: "settings",
          moduleId: "demo.settings",
          owner: "apps/demo/api",
        }),
      /already exists/u,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unsafe module input", () => {
  const root = createFixture();
  try {
    assert.throws(
      () =>
        createModule({
          rootDir: root,
          target: "../outside",
          moduleName: "settings",
          moduleId: "demo.settings",
          owner: "apps/demo/api",
        }),
      /Target/u,
    );
    assert.throws(
      () =>
        createModule({
          rootDir: root,
          target: "apps/demo/api",
          moduleName: "Settings",
          moduleId: "demo.settings",
          owner: "apps/demo/api",
        }),
      /kebab case/u,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
