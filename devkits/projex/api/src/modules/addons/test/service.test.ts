import test from "node:test";
import assert from "node:assert/strict";
import { readAddonCatalog } from "../service/addons.service.js";

test("reads the registered add-on catalog", () => {
  const catalog = readAddonCatalog();
  assert.equal(catalog.summary.addonCount, 11);
  assert.equal(catalog.summary.enabledCount, 11);
  assert.ok(catalog.addons.some((addon) => addon.id === "mailer"));
});
