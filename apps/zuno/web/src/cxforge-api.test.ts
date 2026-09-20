import assert from "node:assert/strict";
import test from "node:test";
import { createCxforgeTask, getCxforgeOverview, queueCxforgeTask, reviewCxforgeTask } from "./cxforge-api.js";

test("Zuno reads the CXForge overview from the configured server", async () => {
  const requests: string[] = [];
  const overview = await getCxforgeOverview("http://zuno.local/", async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify({ agents: [], artifacts: [], components: ["api", "runner"], containerId: "f47a748976b9", containerName: "cxforge-1", frontEndPortUrl: "http://runner.local:7300", latencyMs: 4, mode: "local-edge", previewPorts: [7300, 7301], runnerUrl: "http://runner.local", serverId: "11111111-1111-4111-8111-111111111111", skills: [], tasks: [] }), { status: 200 });
  });
  assert.equal(requests[0], "http://zuno.local/api/v1/zuno/cxforge/overview");
  assert.equal(overview.runnerUrl, "http://runner.local");
});

test("Zuno sends a scoped task contract to CXForge", async () => {
  let body = "";
  let method = "";
  await createCxforgeTask("http://zuno.local", { title: "Test stream", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"] }, async (_url, init) => {
    body = String(init?.body);
    method = init?.method ?? "";
    return new Response(JSON.stringify({ id: "42", title: "Test stream", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"], status: "draft", report: "Created", createdAt: "2026-01-01T00:00:00.000Z" }), { status: 201 });
  });
  assert.equal(method, "POST");
  assert.deepEqual(JSON.parse(body), { title: "Test stream", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"] });
});

test("Zuno queues a created task through its server proxy", async () => {
  const requests: string[] = [];
  const task = await queueCxforgeTask("http://zuno.local", "42", async (url, init) => {
    requests.push(`${url} ${init?.method}`);
    return new Response(JSON.stringify({ id: "42", title: "Queue task", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"], status: "queued", report: "Queued", previewUrl: "http://runner.local:7300/preview/42", createdAt: "2026-01-01T00:00:00.000Z" }), { status: 200 });
  });
  assert.equal(requests[0], "http://zuno.local/api/v1/zuno/cxforge/tasks/42/queue POST");
  assert.equal(task.status, "queued");
});

test("Zuno sends a review decision through its server proxy", async () => {
  const requests: string[] = [];
  const task = await reviewCxforgeTask("http://zuno.local", "42", "approve", async (url, init) => {
    requests.push(`${url} ${init?.method}`);
    return new Response(JSON.stringify({ id: "42", title: "Review task", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"], status: "approved", report: "Review approved in Zuno.", createdAt: "2026-01-01T00:00:00.000Z" }), { status: 200 });
  });
  assert.equal(requests[0], "http://zuno.local/api/v1/zuno/cxforge/tasks/42/approve POST");
  assert.equal(task.status, "approved");
});
