import assert from "node:assert/strict";
import test from "node:test";
import { assignmentPrompt, listZetroHandoffs, type AcceptedZetroHandoff } from "./handoff-api.js";

const accepted: AcceptedZetroHandoff = {
  acceptedAt: "2026-09-20T00:00:00.000Z",
  handoff: {
    brief: { constraints: "Keep module boundaries", exclusions: "No deployment", outcome: "Reliable intake", projectReference: "codexsun/codexsun", projectScope: "project", risks: "Duplicate dispatch", scope: "Zetro to Zuno", successSignals: "One receipt" },
    task: { acceptanceCriteria: "Tests pass", id: "11111111-1111-4111-8111-111111111111", priority: "medium", summary: "Verify the handoff.", title: "Verify handoff" },
  },
  zunoHandoffId: "22222222-2222-4222-8222-222222222222",
};

test("reads the authenticated Zetro handoff inbox", async () => {
  const urls: string[] = [];
  const handoffs = await listZetroHandoffs("http://zuno.local/", async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ data: { handoffs: [accepted] }, version: "v1" }), { status: 200 });
  });
  assert.equal(urls[0], "http://zuno.local/api/v1/zuno/handoffs/zetro");
  assert.equal(handoffs[0]?.handoff.task.title, "Verify handoff");
});

test("builds a CXForge prompt without dropping brief constraints", () => {
  const prompt = assignmentPrompt(accepted);
  assert.match(prompt, /Acceptance criteria:\nTests pass/u);
  assert.match(prompt, /Constraints: Keep module boundaries/u);
  assert.match(prompt, /Zetro handoff receipt: 22222222/u);
});
