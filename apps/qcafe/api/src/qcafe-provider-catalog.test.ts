import assert from "node:assert/strict";
import test from "node:test";
import { createQcafeProviders } from "./qcafe-provider-catalog.js";

test("declares the Q Cafe owner module catalog", () => {
  const manifests = createQcafeProviders().map((provider) => provider.manifest);

  assert.deepEqual(
    manifests.map((manifest) => manifest.id),
    [
      "qcafe.foundation",
      "qcafe.menu",
      "qcafe.pos",
      "qcafe.kitchen",
      "qcafe.booking",
      "qcafe.inventory",
      "qcafe.billing",
      "qcafe.devices",
    ],
  );
  assert.deepEqual(manifests.find((manifest) => manifest.id === "qcafe.pos")?.dependencies, [
    "qcafe.foundation",
    "qcafe.menu",
  ]);
  assert.ok(manifests.every((manifest) => manifest.events.published.length === 0));
  assert.ok(manifests.every((manifest) => manifest.events.consumed.length === 0));
});
