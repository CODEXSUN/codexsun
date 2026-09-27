import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { ProjectStore } from "../project-store.js";

const databasePath = resolve(process.cwd(), "../../../storage/runtime/codeloop-projects-test.sqlite");

test("persists projects per owner and seeds a default once", () => {
  mkdirSync(dirname(databasePath), { recursive: true });
  if (existsSync(databasePath)) rmSync(databasePath, { force: true });
  const store = new ProjectStore(databasePath);
  store.initialize();
  const project = {
    id: "codexsun",
    name: "codexsun",
    path: "E:/codexsun/codexsun",
    sourceType: "local" as const,
    description: "Main repository",
    instructions: "Follow repository rules.",
  };
  assert.equal(store.ensureDefault("owner-a", project).id, "codexsun");
  assert.equal(store.ensureDefault("owner-a", { ...project, name: "Changed" }).name, "codexsun");
  assert.equal(store.get("owner-a", "codexsun")?.path, project.path);
  assert.equal(store.get("owner-b", "codexsun"), null);
  assert.deepEqual(store.list("owner-b"), []);
  assert.deepEqual(store.list("owner-a").map((item) => ({ id: item.id, name: item.name, path: item.path, sourceType: item.sourceType, description: item.description, instructions: item.instructions })), [project]);
  store.close();
  rmSync(databasePath, { force: true });
});
