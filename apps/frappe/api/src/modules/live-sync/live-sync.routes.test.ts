import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { registerFrappeLiveSyncRoutes } from "./live-sync.routes.js";

test("manual live sync rejects export kinds outside the approved policy before queueing", async () => {
  const queued: string[] = [];
  const app = Fastify();
  registerFrappeLiveSyncRoutes(app, {
    settings: async () => ({
      enabled: true,
      paused: false,
      direction: "bidirectional",
      inboundBaseUrl: null,
      inboundCheckpointAt: null,
      scheduleMinutes: 15,
      modules: { contacts: true, enquiries: true, activities: true, "call-logs": true },
      lastScheduledAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: "test",
      backgroundWorkerEnabled: true
    }),
    save: async (_request, input) => ({
      ...input,
      inboundBaseUrl: null,
      inboundCheckpointAt: null,
      lastScheduledAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: "test",
      backgroundWorkerEnabled: true
    }),
    queue: async (_request, kind) => {
      queued.push(kind);
      return { id: 1 };
    },
    jobs: async () => []
  });
  try {
    for (const kind of ["contacts", "call-logs"] as const) {
      const response = await app.inject({
        method: "POST",
        url: `/frappe/live-sync/${kind}/resync`,
        payload: {}
      });
      assert.equal(response.statusCode, 403);
      assert.match(response.body, /Only enquiries can be exported/u);
    }
    const response = await app.inject({
      method: "POST",
      url: "/frappe/live-sync/enquiries/resync",
      payload: {}
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(queued, ["enquiries"]);
    const input = {
      enabled: true,
      paused: false,
      direction: "inbound",
      scheduleMinutes: 5,
      modules: { contacts: false, enquiries: true, activities: false, "call-logs": false }
    };
    const saved = await app.inject({ method: "PUT", url: "/frappe/live-sync", payload: input });
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.json().data.direction, "inbound");
    const forgedCheckpoint = await app.inject({
      method: "PUT",
      url: "/frappe/live-sync",
      payload: { ...input, inboundCheckpointAt: "2099-01-01T00:00:00.000Z" }
    });
    assert.equal(forgedCheckpoint.statusCode, 400, "Clients cannot advance the worker checkpoint");
  } finally {
    await app.close();
  }
});
