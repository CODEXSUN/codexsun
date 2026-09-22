import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { InfrasStore } from "../infras-store.js";

test("seeds Orship infrastructure records in SQLite", () => {
  const root = join(tmpdir(), `orship-infras-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  const store = new InfrasStore(join(root, "orship_db.sqlite"));
  try {
    const infras = store.list();
    assert.equal(infras.length, 3);
    assert.equal(infras[0].kind, "infras");
    assert.ok(infras[0].id > 0);
    assert.match(infras[0].uuid, /^[0-9a-f-]{36}$/);
    assert.match(infras[0].composeYaml, /services:/);
    assert.equal(store.get(infras[0].uuid)?.name, infras[0].name);
  } finally {
    store.close();
  }
});

test("creates an Orship infrastructure record with YAML payload", () => {
  const root = join(tmpdir(), `orship-infras-create-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  const store = new InfrasStore(join(root, "orship_db.sqlite"));
  try {
    const infra = store.create({
      composeYaml: "name: sample\nservices:\n  app:\n    image: sample:latest\n",
      containerName: "orship-sample",
      description: "Sample container.",
      image: "sample:latest",
      name: "Sample",
      port: 8081,
      ports: "8081:80",
      rootUser: "root",
      summary: "Sample setup",
    });
    assert.equal(store.get(infra.uuid)?.composeYaml, infra.composeYaml);
    assert.equal(infra.detail.ports, "8081:80");
    assert.equal(infra.status, "running");
  } finally {
    store.close();
  }
});
