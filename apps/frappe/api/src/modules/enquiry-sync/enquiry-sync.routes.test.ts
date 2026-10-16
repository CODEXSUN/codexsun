import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import Fastify from "fastify";
import type { Kysely } from "kysely";
import type { EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "../connection/index.js";
import { registerFrappeEnquirySyncRoutes } from "./enquiry-sync.routes.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("remote preview, selected pull, and import job routes are available", async () => {
  const created: string[] = [];
  let latestImport: {
    jobId: number;
    status: "pending";
    progress: null;
    errorMessage: null;
  } | null = {
    jobId: 7,
    status: "pending",
    progress: null,
    errorMessage: null
  };
  const query = (table: string) => {
    const builder = {
      selectAll: () => builder,
      select: () => builder,
      where: () => builder,
      innerJoin: () => builder,
      execute: async () => [],
      executeTakeFirst: async () => {
        if (table === "crm_enquiry_statuses") return { id: 2, code: "new" };
        if (table === "crm_enquiry_priorities") return { id: 3 };
        return null;
      }
    };
    return builder;
  };
  const insert = {
    values: () => insert,
    onDuplicateKeyUpdate: () => insert,
    execute: async () => {}
  };
  const database = {
    selectFrom: query,
    insertInto: () => insert
  } as unknown as Kysely<FrappeDatabase>;
  globalThis.fetch = async (input) =>
    String(input).includes("get_count")
      ? Response.json({ message: 1 })
      : Response.json({
          data: String(input).includes("/api/resource/Enquiry?")
            ? [{ name: "ENQ27", title: "Machine issue", date: "2026-10-06" }]
            : {
                name: "ENQ27",
                title: "Machine issue",
                mobile: "9994885548",
                date: "2026-10-06",
                status: "New",
                priority: "Normal"
              }
        });
  const app = Fastify();
  registerFrappeEnquirySyncRoutes(
    app,
    async () => ({
      database,
      createEnquiry: async (input) => {
        created.push(input.sourceReference ?? "");
        return { id: 42 } as EnquiryRecord;
      },
      updateEnquiry: async () => {
        throw new Error("Unexpected update");
      },
      localUserForEmployee: async () => null,
      listInForName: async () => null
    }),
    { baseUrl: "https://frappe.example.com/", apiKey: "key", apiSecret: "secret", enabled: true },
    "secret",
    {
      start: async () => ({ jobId: 7, status: "pending" }),
      status: async () => ({ jobId: 7, status: "pending", progress: null, errorMessage: null }),
      latest: async () => latestImport
    }
  );
  try {
    const preview = await app.inject({ method: "GET", url: "/frappe/enquiries/remote?page=1" });
    assert.equal(preview.statusCode, 200);
    assert.equal(preview.json().data.items[0].name, "ENQ27");
    assert.equal(preview.json().data.total, 1);

    const pull = await app.inject({
      method: "POST",
      url: "/frappe/enquiries/pull",
      payload: { remoteName: "ENQ27" }
    });
    assert.equal(pull.statusCode, 200);
    assert.equal(pull.json().data.status, "created");
    assert.deepEqual(created, ["ENQ27"]);

    const latest = await app.inject({ method: "GET", url: "/frappe/enquiries/import" });
    assert.equal(latest.statusCode, 200);
    assert.equal(latest.json().data.jobId, 7);

    latestImport = null;
    const emptyLatest = await app.inject({ method: "GET", url: "/frappe/enquiries/import" });
    assert.equal(emptyLatest.statusCode, 200);
    assert.equal(emptyLatest.json().data, null);

    const queued = await app.inject({
      method: "POST",
      url: "/frappe/enquiries/import",
      payload: {}
    });
    assert.equal(queued.statusCode, 200);
    assert.equal(queued.json().data.jobId, 7);
  } finally {
    await app.close();
  }
});
