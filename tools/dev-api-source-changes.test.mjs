import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { repositoryTempDirectory as tmpdir } from "./repository-temp.mjs";
import { join } from "node:path";
import test from "node:test";
import {
  apiSourceDirectories,
  captureApiInputs,
  changedApiInputs
} from "./dev-api-source-changes.mjs";

test("API watcher restarts only for changed source or environment content", async () => {
  const root = await mkdtemp(join(tmpdir(), "codexsun-api-watch-"));
  const sourceDirectory = join(root, "apps/platform/api/src");
  const sourceFile = join(sourceDirectory, "server.ts");
  const envFile = join(root, ".env");

  try {
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(sourceFile, "export const ready = true;\n");
    await writeFile(envFile, "PLATFORM_API_PORT=7010\n");
    const initial = await captureApiInputs(root);

    await utimes(sourceFile, new Date(), new Date());
    assert.deepEqual(changedApiInputs(initial, await captureApiInputs(root)), []);

    await writeFile(sourceFile, "export const ready = false;\n");
    const changedSource = await captureApiInputs(root);
    assert.deepEqual(changedApiInputs(initial, changedSource), ["apps/platform/api/src/server.ts"]);
    assert.deepEqual(changedApiInputs(changedSource, await captureApiInputs(root)), []);

    await writeFile(envFile, "PLATFORM_API_PORT=7011\n");
    const changedEnv = await captureApiInputs(root);
    assert.deepEqual(changedApiInputs(changedSource, changedEnv), [".env"]);

    const ecommerceDirectory = join(root, "apps/ecommerce/api/src/modules/overview");
    await mkdir(ecommerceDirectory, { recursive: true });
    await writeFile(
      join(ecommerceDirectory, "overview.service.ts"),
      "export const ecommerce = true;\n"
    );
    const ecommerceInputs = await captureApiInputs(root);
    assert.deepEqual(changedApiInputs(changedEnv, ecommerceInputs), [
      "apps/ecommerce/api/src/modules/overview/overview.service.ts"
    ]);

    const frappeDirectory = join(root, "apps/frappe/api/src/modules/connection");
    await mkdir(frappeDirectory, { recursive: true });
    await writeFile(
      join(frappeDirectory, "connection.live-enquiries.ts"),
      "export const live = true;\n"
    );
    const frappeInputs = await captureApiInputs(root);
    assert.deepEqual(changedApiInputs(ecommerceInputs, frappeInputs), [
      "apps/frappe/api/src/modules/connection/connection.live-enquiries.ts"
    ]);
    assert.ok(apiSourceDirectories(root).includes(join(root, "apps/frappe/api/src")));
    await rm(sourceFile);
    assert.deepEqual(changedApiInputs(frappeInputs, await captureApiInputs(root)), [
      "apps/platform/api/src/server.ts"
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
