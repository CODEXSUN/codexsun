import assert from "node:assert/strict";
import test from "node:test";
import { SitesContentStore } from "../content-store.js";

test("seeds and reads published client content from SQLite", () => {
  const store = new SitesContentStore(":memory:");
  try {
    const sites = store.listPublished();
    assert.deepEqual(
      sites.map((site) => site.slug),
      ["codexsun", "devxcrew", "logicx", "skilloopz"],
    );
    assert.equal(store.findPublished("codexsun")?.sections[0]?.type, "about");
    assert.equal(store.findPublished("unknown"), undefined);
  } finally {
    store.close();
  }
});

test("stores a private draft and publishes it explicitly", () => {
  const store = new SitesContentStore(":memory:");
  try {
    const current = store.findEditable("codexsun");
    assert.ok(current);
    const draft = store.saveDraft("codexsun", { ...current, description: "Draft description" });
    assert.equal(draft?.hasDraft, true);
    assert.equal(store.findPublished("codexsun")?.description, current.description);
    assert.equal(store.publish("codexsun")?.hasDraft, false);
    assert.equal(store.findPublished("codexsun")?.description, "Draft description");
    assert.equal(store.unpublish("codexsun")?.published, false);
    assert.equal(store.findPublished("codexsun"), undefined);
    const revisions = store.listRevisions("codexsun");
    assert.deepEqual(revisions.map((revision) => revision.action), ["unpublish", "publish", "draft"]);
    assert.equal(store.restoreRevision("codexsun", revisions[1]!.id)?.hasDraft, true);
  } finally {
    store.close();
  }
});
