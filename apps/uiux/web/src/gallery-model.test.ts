import assert from "node:assert/strict";
import test from "node:test";
import { uiRegistry } from "@codexsun/ui";
import { getGalleryEntries, getPreviewState, getSelectedEntry } from "./gallery-model.js";

test("filters the public registry and keeps a visible selection", () => {
  const components = getGalleryEntries(uiRegistry, "component");

  assert.ok(components.length > 0);
  assert.ok(components.every((entry) => entry.layer === "component"));
  assert.equal(getSelectedEntry(components, "missing")?.id, components[0]?.id);
});

test("falls back to a selected item's supported preview state", () => {
  const button = uiRegistry.find((entry) => entry.id === "ui.component.button");
  assert.ok(button);
  assert.equal(getPreviewState(button, "loading"), "default");
  assert.equal(getPreviewState(button, "disabled"), "disabled");
});
