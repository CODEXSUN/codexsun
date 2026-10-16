import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { repositoryTempDirectory as tmpdir } from "../../../../../tools/repository-temp.mjs";
import { join } from "node:path";
import test from "node:test";
import { ClientContentStore } from "./content-store.mjs";

test("site identity survives reopen and rejects another site", () => {
  const directory = mkdtempSync(join(tmpdir(), "codexsun-sites-"));
  const path = join(directory, "content.sqlite");
  try {
    const first = new ClientContentStore(path, "c0de0001");
    assert.deepEqual(first.identity(), { schemaVersion: 1, siteUuid: "c0de0001" });
    first.close();
    const reopened = new ClientContentStore(path, "c0de0001");
    assert.equal(reopened.identity().siteUuid, "c0de0001");
    reopened.close();
    assert.throws(() => new ClientContentStore(path, "c0de0002"), /another site/u);
    const original = new ClientContentStore(path, "c0de0001");
    assert.equal(original.identity().siteUuid, "c0de0001");
    original.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects invalid public site identities", () => {
  for (const uuid of ["", "C0DE0001", "123", "../../db", "zzzzzzzz"]) {
    assert.throws(() => new ClientContentStore(":memory:", uuid), /UUID/u);
  }
});
