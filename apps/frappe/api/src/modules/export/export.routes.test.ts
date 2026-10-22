import assert from "node:assert/strict";
import Fastify from "fastify";
import { test } from "node:test";
import { registerFrappeExportRoutes } from "./export.routes.js";

test("Frappe record status route returns the latest verified states", async () => {
  const app = Fastify({ logger: false });
  let received: { kind: string; ids: number[] } | null = null;
  registerFrappeExportRoutes(app, {
    preview: async () => ({ items: [], page: 1, pageSize: 50, total: 0 }),
    enqueue: async () => ({ jobId: 1, status: "pending" }),
    status: async () => ({ jobId: 1, status: "completed", progress: null, errorMessage: null }),
    recordStatuses: async (_request, kind, ids) => {
      received = { kind, ids };
      return ids.map((id) => ({ id, status: "synced" as const }));
    }
  });

  const response = await app.inject({
    method: "POST",
    url: "/frappe/export/call-logs/status",
    payload: { ids: [17, 18] }
  });

  assert.equal(response.statusCode, 200, response.body);
  assert.deepEqual(response.json().data.items, [
    { id: 17, status: "synced" },
    { id: 18, status: "synced" }
  ]);
  assert.deepEqual(received, { kind: "call-logs", ids: [17, 18] });
  await app.close();
});
