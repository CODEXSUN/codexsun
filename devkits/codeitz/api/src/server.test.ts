import test from "node:test";
import assert from "node:assert/strict";
import { CodeitzFoundationProvider } from "./modules/foundation/provider.js";
import { CodeitzEngineeringProvider } from "./modules/engineering/provider.js";
import { CodeitzLearningProvider } from "./modules/learning/provider.js";
import { CodeitzSkillsProvider } from "./modules/skills/provider.js";

test("codeitz API declares its owned health contract", () => {
  const provider = new CodeitzFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["codeitz.health"]);
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/foundation");
});

test("codeitz API declares engineering, learning, and skills providers", () => {
  const engineering = new CodeitzEngineeringProvider();
  assert.equal(engineering.manifest.id, "codeitz.engineering");
  assert.equal(engineering.manifest.owner, "devkits/codeitz/api/modules/engineering");

  const learning = new CodeitzLearningProvider();
  assert.equal(learning.manifest.id, "codeitz.learning");
  assert.equal(learning.manifest.owner, "devkits/codeitz/api/modules/learning");

  const skills = new CodeitzSkillsProvider();
  assert.equal(skills.manifest.id, "codeitz.skills");
  assert.equal(skills.manifest.owner, "devkits/codeitz/api/modules/skills");
});
