import assert from "node:assert/strict";
import test from "node:test";
import { createCxforgeTask, getCxforgeOverview, getCxforgeRuntime, getCxforgeRuntimeLogs, manageCxforgeRuntime, mergeCxforgeTask, openCxforgeMergeRequest, prepareCxforgeMergeRequest, queueCxforgeTask, reviewCxforgeTask } from "./cxforge-api.js";

test("Zuno reads the CXForge overview from the configured server", async () => {
  const requests: string[] = [];
  const overview = await getCxforgeOverview("http://zuno.local/", async (url) => {
    requests.push(String(url));
    return new Response(JSON.stringify({ agents: [], artifacts: [], components: ["api", "runner"], containerId: "f47a748976b9", containerName: "cxforge-1", frontEndPortUrl: "http://runner.local:7300", latencyMs: 4, mode: "local-edge", previewPorts: [7300, 7301], runnerUrl: "http://runner.local", serverId: "11111111-1111-4111-8111-111111111111", skills: [], tasks: [{ id: "42", title: "Review task", appName: "Web", prompt: "Run the web checks.", repository: "/srv/repo", ownedPaths: ["apps/web"], status: "review", report: "Ready", changedFiles: ["apps/web/src/app.tsx"], testOutput: "tests passed", diff: "+review evidence", createdAt: "2026-01-01T00:00:00.000Z" }] }), { status: 200 });
  });
  assert.equal(requests[0], "http://zuno.local/api/v1/zuno/cxforge/overview");
  assert.equal(overview.runnerUrl, "http://runner.local");
  assert.deepEqual(overview.tasks[0]?.changedFiles, ["apps/web/src/app.tsx"]);
  assert.equal(overview.tasks[0]?.testOutput, "tests passed");
  assert.equal(overview.tasks[0]?.diff, "+review evidence");
});

test("Zuno reads and manages the local CXForge runtime", async () => {
  const requests: string[] = [];
  const runtime = { composeFile: "apps/cxforge/.container/compose.yml", composeVersion: "2.33.1", container: { health: "healthy", installed: true, name: "cxforge", running: true, state: "running" }, dockerAvailable: true, dockerVersion: "27.5.1", projectName: "cxforgefresh", toolchain: { git: "git version 2.47.2", go: "go version go1.23.6 linux/amd64", node: "v22.14.0", npm: "10.9.2", python: "Python 3.12.9" } } as const;
  const request = async (url: URL | RequestInfo, init?: RequestInit) => {
    requests.push(`${url} ${init?.method ?? "GET"}`);
    return new Response(JSON.stringify(String(url).endsWith("/logs") ? { lines: ["CXForge ready"] } : runtime), { status: 200 });
  };

  const status = await getCxforgeRuntime("http://zuno.local", request);
  const logs = await getCxforgeRuntimeLogs("http://zuno.local", request);
  const restarted = await manageCxforgeRuntime("http://zuno.local", "restart", request);

  assert.equal(status.toolchain.go, "go version go1.23.6 linux/amd64");
  assert.deepEqual(logs, ["CXForge ready"]);
  assert.equal(restarted.container.health, "healthy");
  assert.deepEqual(requests, [
    "http://zuno.local/api/v1/zuno/cxforge/runtime GET",
    "http://zuno.local/api/v1/zuno/cxforge/runtime/logs GET",
    "http://zuno.local/api/v1/zuno/cxforge/runtime/restart POST",
  ]);
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

test("Zuno prepares an approved task for merge request creation", async () => {
  const requests: string[] = [];
  const task = await prepareCxforgeMergeRequest("http://zuno.local", "42", async (url, init) => {
    requests.push(`${url} ${init?.method}`);
    return new Response(JSON.stringify({ id: "42", title: "Review task", appName: "Web", prompt: "Run the web checks.", repository: "codexsun/codexsun", ownedPaths: ["apps/web"], status: "approved", report: "Merge request draft prepared.", mergeRequest: { title: "Review task", description: "Checks passed.", baseBranch: "main", sourceBranch: "cxforge/42", branchPublished: true, status: "draft" }, createdAt: "2026-01-01T00:00:00.000Z" }), { status: 200 });
  });
  assert.equal(requests[0], "http://zuno.local/api/v1/zuno/cxforge/tasks/42/prepare-merge POST");
  assert.equal(task.mergeRequest?.baseBranch, "main");
});

test("Zuno opens and merges a prepared pull request through separate actions", async () => {
  const requests: string[] = [];
  const request = async (url: URL | RequestInfo, init?: RequestInit) => {
    requests.push(`${url} ${init?.method}`);
    const merged = String(url).endsWith("/merge");
    return new Response(JSON.stringify({ id: "42", title: "Review task", appName: "Web", prompt: "Run the web checks.", repository: "codexsun/codexsun", ownedPaths: ["apps/web"], status: merged ? "merged" : "approved", report: merged ? "Merged" : "Pull request created", mergeRequest: { title: "Review task", description: "Checks passed.", baseBranch: "main", sourceBranch: "cxforge/42", branchPublished: true, provider: "github", externalId: "17", url: "https://github.com/codexsun/codexsun/pull/17", status: merged ? "merged" : "open" }, createdAt: "2026-01-01T00:00:00.000Z" }), { status: 200 });
  };
  const opened = await openCxforgeMergeRequest("http://zuno.local", "42", request);
  const merged = await mergeCxforgeTask("http://zuno.local", "42", request);
  assert.deepEqual(requests, ["http://zuno.local/api/v1/zuno/cxforge/tasks/42/open-merge-request POST", "http://zuno.local/api/v1/zuno/cxforge/tasks/42/merge POST"]);
  assert.equal(opened.mergeRequest?.status, "open");
  assert.equal(merged.status, "merged");
});
