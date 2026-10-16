import assert from "node:assert/strict";
import test from "node:test";
import { platformAppRegistry } from "../../app/app-registry";
import { landingAppChoices } from "./landing-app-choices";

test("landing choices use the registered identity of every enabled app", () => {
  const choices = landingAppChoices(platformAppRegistry.map((app) => app.id));

  assert.equal(choices.length, platformAppRegistry.length);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, choices.length);

  for (const app of platformAppRegistry) {
    const choice = choices.find((item) => item.id === app.id);
    assert.equal(choice?.label, app.label);
    assert.equal(choice?.description, app.description);
    assert.ok(choice?.icon);
    assert.equal(choice?.iconSrc, app.id === "crm" ? "/logo/app-icon.png" : undefined);
  }
});
