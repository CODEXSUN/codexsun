import assert from "node:assert/strict";
import test from "node:test";
import {
  createSweTask,
  fetchCodeitzHealth,
  fetchHeuristics,
  fetchSkills,
  fetchSweTasks,
} from "./codeitz-api.js";

test("fetchCodeitzHealth calls health endpoint", async () => {
  const mockFetch: typeof fetch = async (input) => {
    assert.equal(String(input), "/api/v1/codeitz/health");
    return new Response(JSON.stringify({ status: "ok", providers: ["codeitz.foundation"] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await fetchCodeitzHealth(mockFetch);
  assert.equal(result.status, "ok");
  assert.deepEqual(result.providers, ["codeitz.foundation"]);
});

test("fetchSweTasks and createSweTask call SWE routes", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    if (init?.method === "POST") {
      assert.equal(String(input), "/api/v1/codeitz/swe/tasks");
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          id: "123",
          title: body.title,
          prompt: body.prompt,
          phase: "intake",
          status: "queued",
          targetPaths: body.targetPaths ?? [],
          createdAt: new Date().toISOString(),
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    assert.equal(String(input), "/api/v1/codeitz/swe/tasks");
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const list = await fetchSweTasks(mockFetch);
  assert.deepEqual(list, []);

  const created = await createSweTask(
    { title: "Fix auth", prompt: "Fix token verification" },
    mockFetch,
  );
  assert.equal(created.title, "Fix auth");
  assert.equal(created.phase, "intake");
});

test("fetchHeuristics and fetchSkills call learning and skills endpoints", async () => {
  const mockFetch: typeof fetch = async (input) => {
    if (String(input).includes("heuristics")) {
      return new Response(JSON.stringify([{ id: "h1", rule: "rule1" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([{ id: "s1", name: "agentic-swe-pipeline" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const heuristics = await fetchHeuristics(mockFetch);
  assert.equal(heuristics.length, 1);
  assert.equal(heuristics[0].rule, "rule1");

  const skills = await fetchSkills(mockFetch);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, "agentic-swe-pipeline");
});
