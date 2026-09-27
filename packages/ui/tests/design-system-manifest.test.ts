import assert from "node:assert/strict";
import test from "node:test";

import {
  createDesignSystemSelection,
  designSystemManifest,
  resolveDesignSystemTemplateVariant,
  validateDesignSystemManifest,
} from "../src/design-system/index";

test("design-system manifest is unique, complete, and package-owned", () => {
  assert.deepEqual(validateDesignSystemManifest(), { valid: true, errors: [] });
  assert.ok(designSystemManifest.length > 0);
  assert.ok(designSystemManifest.some((asset) => asset.kind === "block" && asset.id === "app-header"));
  assert.ok(designSystemManifest.some((asset) => asset.kind === "template" && asset.id === "master-list"));
});

test("selection resolves template variants with the same contract as other assets", () => {
  assert.equal(resolveDesignSystemTemplateVariant("master-list", "v3"), "v3");
  const selection = createDesignSystemSelection({ templates: { "master-list": "v3" } });
  assert.equal(selection.templates["master-list"], "v3");
});

test("selection rejects unknown ids and variants before application composition", () => {
  assert.throws(
    () => createDesignSystemSelection({ templates: { missing: "default" } }),
    /Unknown design-system selection/,
  );
  assert.throws(
    () => createDesignSystemSelection({ templates: { "master-list": "missing" } }),
    /Unknown master-list variant/,
  );
});
