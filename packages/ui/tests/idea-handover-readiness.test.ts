import assert from "node:assert/strict";
import test from "node:test";
import type { IdeaBriefDraft } from "../src/blocks/idea-handover/idea-handover-workspace.tsx";
import { getBriefReadiness, isBriefReady, parseAcceptanceCriteria, serializeAcceptanceCriteria } from "../src/blocks/idea-handover/idea-handover-readiness.ts";

function completeBrief(): IdeaBriefDraft {
  return {
    audience: "Product teams",
    constraints: "Zetro does not execute code",
    exclusions: "Repository orchestration",
    outcome: "An implementation-ready handoff",
    projectReference: null,
    projectScope: "all-projects",
    risks: "Ambiguous ownership",
    scope: "Idea refinement and task preparation",
    sourceMessageIds: ["message-1"],
    status: "draft",
    successSignals: "Zuno accepts the package",
    title: "Zetro handoff",
  };
}

test("requires all brief decisions before finalization", () => {
  assert.equal(isBriefReady(completeBrief()), true);

  const incomplete = { ...completeBrief(), risks: "", sourceMessageIds: [] };
  assert.equal(isBriefReady(incomplete), false);
  assert.deepEqual(getBriefReadiness(incomplete).filter((item) => !item.complete).map((item) => item.id), ["risks", "sources"]);
});

test("requires a project reference only for project-scoped briefs", () => {
  assert.equal(isBriefReady({ ...completeBrief(), projectScope: "project" }), false);
  assert.equal(isBriefReady({ ...completeBrief(), projectReference: "codexsun", projectScope: "project" }), true);
});

test("normalizes acceptance criteria into one item per line", () => {
  const items = parseAcceptanceCriteria("- Build passes\n2. Preview is visible\n\n* User approves");
  assert.deepEqual(items, ["Build passes", "Preview is visible", "User approves"]);
  assert.equal(serializeAcceptanceCriteria(items), "Build passes\nPreview is visible\nUser approves");
});
