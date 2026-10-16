import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { z } from "zod";
import { registerContractStreamRoute } from "./route-contract.js";

test("stream route validates input and delivers ordered envelopes", async () => {
  const app = Fastify();
  registerContractStreamRoute(app, {
    method: "POST",
    url: "/stream",
    schemas: {
      body: z.object({ text: z.string().min(1) }).strict(),
      response: z.object({ event: z.enum(["token", "complete"]), content: z.string() })
    },
    handler: async ({ body, emit }) => {
      emit({ event: "token", content: body.text });
      emit({ event: "complete", content: "saved" });
    }
  });
  const response = await app.inject({ method: "POST", url: "/stream", payload: { text: "hello" } });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"] ?? "", /application\/x-ndjson/);
  const lines = response.body
    .trim()
    .split("\n")
    .map(
      (line) => JSON.parse(line) as { success: boolean; data: { event: string; content: string } }
    );
  assert.deepEqual(
    lines.map((line) => line.data),
    [
      { event: "token", content: "hello" },
      { event: "complete", content: "saved" }
    ]
  );
  assert.ok(lines.every((line) => line.success));
  await app.close();
});
