import assert from "node:assert/strict";
import test from "node:test";
import { createUiRegistry, uiRegistry, uiRegistryLayers, uiRegistryStates } from "../src/registry/ui-registry.js";

const expectedRegistryIds = [
  "ui.component.button",
  "ui.component.input",
  "ui.component.select",
  "ui.component.checkbox",
  "ui.component.switch",
  "ui.component.badge",
  "ui.component.alert",
  "ui.component.card",
  "ui.component.dialog",
  "ui.component.table",
  "ui.component.empty-state",
  "ui.component.skeleton",
  "ui.block.content-section",
  "ui.page.dashboard",
  "ui.page.settings",
  "ui.block.provider-status-card",
  "ui.page.provider-overview",
  "ui.template.mdi-main",
];

test("publishes metadata for every active shared UI item", () => {
  assert.deepEqual(
    uiRegistry.map((entry) => entry.id),
    expectedRegistryIds,
  );

  for (const entry of uiRegistry) {
    assert.equal(entry.status, "active");
    assert.ok(uiRegistryLayers.includes(entry.layer));
    assert.ok(entry.variants.includes(entry.defaultVariant));
    assert.ok(entry.states.length > 0);
    assert.ok(entry.states.every((state) => uiRegistryStates.includes(state)));
    assert.ok(entry.accessibility.length > 0);
    assert.ok(entry.exampleData.trim());
  }
});

test("rejects duplicate and incomplete registry metadata", () => {
  assert.throws(() => createUiRegistry([uiRegistry[0]!, uiRegistry[0]!]), /Duplicate UI registry ID/u);
  assert.throws(
    () => createUiRegistry([{ ...uiRegistry[0]!, accessibility: [] }]),
    /Registry entry metadata is incomplete/u,
  );
  assert.throws(
    () => createUiRegistry([{ ...uiRegistry[0]!, states: ["not-a-state" as never] }]),
    /Invalid UI registry state/u,
  );
});
