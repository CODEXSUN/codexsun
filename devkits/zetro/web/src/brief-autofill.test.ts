import assert from "node:assert/strict";
import test from "node:test";
import type { IdeaBriefDraft } from "@codexsun/ui/blocks/idea-handover";
import { fillBriefFromSources } from "./brief-autofill";

function emptyBrief(): IdeaBriefDraft {
  return { audience: "", constraints: "", exclusions: "", outcome: "", projectReference: null, projectScope: "all-projects", risks: "", scope: "", sourceMessageIds: ["selected"], status: "draft", successSignals: "", title: "" };
}

test("fills empty brief fields from structured selected responses", () => {
  const result = fillBriefFromSources(emptyBrief(), [{
    id: "selected",
    content: "# Zetro handoff\n\n## Outcome\nPrepare an implementation-ready idea brief.\n\n## Scope\nIdea refinement and task preparation.\n\n**Constraints:** Zetro must not execute repository work.\n\n## Success criteria\nThe package is accepted by Zuno.",
  }]);

  assert.equal(result.title, "Zetro handoff");
  assert.equal(result.outcome, "Prepare an implementation-ready idea brief.");
  assert.equal(result.scope, "Idea refinement and task preparation.");
  assert.equal(result.constraints, "Zetro must not execute repository work.");
  assert.equal(result.successSignals, "The package is accepted by Zuno.");
});

test("preserves user-authored fields and ignores unselected responses", () => {
  const result = fillBriefFromSources(
    { ...emptyBrief(), outcome: "Keep my outcome." },
    [
      { id: "selected", content: "# Selected idea\n\nOutcome: Replace me." },
      { id: "ignored", content: "# Wrong idea\n\nScope: Do not use this." },
    ],
  );

  assert.equal(result.outcome, "Keep my outcome.");
  assert.equal(result.scope, "");
  assert.equal(result.title, "Selected idea");
});
