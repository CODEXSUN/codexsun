import assert from "node:assert/strict";
import test from "node:test";
import { AssistantRepository } from "../repository.js";
import { taskInput } from "../contracts.js";
import { chunkText, Retrieval } from "../retrieval.js";
import { UpstreamError, Upstreams, withRetry } from "../upstreams.js";
import { AssistantService } from "../service.js";
import { readConfig } from "../../../config.js";
import { createApp } from "../../../app.js";

const config = readConfig({ AGENTCREW_TOKEN: "test-only-token-not-a-real-secret-0000" });

test("retrieval reuses embeddings, deduplicates note IDs and bounds the query", async () => {
  let embeddings = 0;
  const upserts: { points: { id: string }[] }[] = [];
  const queries: { limit: number; score_threshold: number }[] = [];
  const transport = (async (url: URL | RequestInfo, options?: RequestInit) => {
    const path = String(url);
    const body = JSON.parse(String(options?.body ?? "{}"));
    if (path.endsWith("/api/embed")) {
      embeddings++;
      return Response.json({ embeddings: [[1, 0, 0]] });
    }
    if (path.includes("/points?")) upserts.push(body);
    if (path.endsWith("/points/query")) {
      queries.push(body);
      return Response.json({ result: { points: [{ payload: { title: "Policy", text: "Approved note" } }] } });
    }
    return Response.json({ result: true });
  }) as typeof fetch;
  const retrieval = new Retrieval(new Upstreams(config, transport));
  await retrieval.add("Policy", "Approved note");
  await retrieval.add("Policy", "Approved note");
  assert.equal(embeddings, 1);
  assert.equal(upserts[0].points[0].id, upserts[1].points[0].id);
  assert.match(await retrieval.search("Policy?"), /\[Policy\]/u);
  assert.equal(queries[0].limit, 4);
  assert.equal(queries[0].score_threshold, 0.35);
});

test("an already cancelled operation never calls the upstream", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
      },
      controller.signal,
      () => {},
    ),
  );
  assert.equal(calls, 0);
});

test("task contracts bound prompt, recurrence and skill selection", () => {
  assert.equal(taskInput.parse({ title: "Plan", prompt: "Help" }).maxRuns, 1);
  assert.equal(taskInput.safeParse({ title: "Plan", prompt: "Help", intervalMinutes: 1 }).success, false);
  assert.equal(taskInput.safeParse({ title: "Plan", prompt: "Help", maxRuns: 100 }).success, false);
  assert.equal(taskInput.safeParse({ title: "Plan", prompt: "Help", skill: "shell" }).success, false);
});

test("chunking bounds individual chunks and preserves overlapping context", () => {
  const chunks = chunkText("x".repeat(2500));
  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [1200, 1200, 500],
  );
});

test("transient failures retry twice and permanent failures do not retry", async () => {
  let attempts = 0;
  let retries = 0;
  const signal = new AbortController().signal;
  await assert.rejects(
    withRetry(
      async () => {
        attempts++;
        throw new UpstreamError(503);
      },
      signal,
      () => retries++,
      async () => {},
    ),
  );
  assert.equal(attempts, 3);
  assert.equal(retries, 2);
  attempts = 0;
  await assert.rejects(
    withRetry(
      async () => {
        attempts++;
        throw new UpstreamError(400);
      },
      signal,
      () => {},
      async () => {},
    ),
  );
  assert.equal(attempts, 1);
});

test("unauthorized requests fail and runs preserve task and attempt records", async () => {
  const repository = new AssistantRepository(":memory:");
  const transport = (async () => Response.json({ message: { content: "Suggested plan with tests." } })) as typeof fetch;
  const upstream = new Upstreams(config, transport);
  const service = new AssistantService(repository, upstream, new Retrieval(upstream));
  const app = createApp(config, service);
  const headers = { authorization: `Bearer ${config.AGENTCREW_TOKEN}` };
  try {
    assert.equal((await app.inject({ url: "/api/v1/agentcrew/tasks" })).statusCode, 401);
    assert.equal((await app.inject({ url: "/health" })).statusCode, 200);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/agentcrew/tasks",
      headers,
      payload: { title: "Review", prompt: "Check design", rag: false },
    });
    assert.equal(response.statusCode, 201);
    const { id, enabled } = response.json();
    assert.equal(enabled, false);
    assert.equal(
      (await app.inject({ method: "POST", url: `/api/v1/agentcrew/tasks/${id}/run`, headers, payload: {} })).statusCode,
      202,
    );
    for (let i = 0; i < 100 && service.state().active; i++) await new Promise((resolve) => setTimeout(resolve, 5));
    const data = (await app.inject({ url: "/api/v1/agentcrew/tasks", headers })).json();
    assert.equal(data.runs[0].status, "completed");
    assert.equal(data.tasks[0].count, 1);
    assert.equal(data.runs[0].taskId, id);
    assert.equal(
      (await app.inject({ method: "POST", url: `/api/v1/agentcrew/tasks/${id}/enable`, headers, payload: {} }))
        .statusCode,
      409,
    );
  } finally {
    await service.close();
    await app.close();
    repository.close();
  }
});

test("duplicate active task requests do not start overlapping runs and pause aborts", async () => {
  const repository = new AssistantRepository(":memory:");
  const transport = ((_url, options) =>
    new Promise((_resolve, reject) =>
      options?.signal?.addEventListener("abort", () => reject(new Error("Aborted"))),
    )) as typeof fetch;
  const upstream = new Upstreams(config, transport);
  const service = new AssistantService(repository, upstream, new Retrieval(upstream));
  try {
    const task = repository.create(taskInput.parse({ title: "Run", prompt: "Wait", rag: false }));
    assert.equal(service.enqueue(task.id), true);
    assert.equal(service.enqueue(task.id), false);
    service.pause(task.id);
    await service.close();
    assert.equal(repository.list<{ status: string }>("run")[0].status, "cancelled");
  } finally {
    await service.close();
    repository.close();
  }
});
