import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import type { EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "./connection.types.js";
import { registerFrappeRoutes } from "./connection.routes.js";

test("source history checks local enquiry visibility before reading retained fields", async () => {
  let denied = true;
  let reads = 0;
  const query = {
    select: () => query,
    where: () => query,
    orderBy: () => query,
    limit: () => query,
    offset: () => query,
    execute: async () => {
      reads++;
      return [
        {
          revision: "revision",
          baseUrl: "https://frappe.example",
          remoteName: "Q930",
          documentJson: '{"enquiry":{"company_name":"Source company"}}',
          capturedAt: "2026-10-23T00:00:00Z"
        }
      ];
    }
  };
  const app = Fastify();
  registerFrappeRoutes(
    app,
    async () => ({
      database: { selectFrom: () => query } as unknown as Kysely<FrappeDatabase>,
      actorEmail: "test",
      loadEnquiry: async () => {
        if (denied) throw AppError.forbidden("Cannot view this enquiry.");
        return { id: 1 } as EnquiryRecord;
      },
      mappedEmployeeCode: async () => null,
      viewer: { actorEmail: "test", actorUserId: 1, canViewAll: false }
    }),
    { baseUrl: "", apiKey: "", apiSecret: "", enabled: false },
    "test",
    false
  );
  try {
    const rejected = await app.inject({ method: "GET", url: "/frappe/enquiries/1/source" });
    assert.equal(rejected.statusCode, 403);
    assert.equal(reads, 0);
    assert.ok(!rejected.body.includes("Source company"));
    denied = false;
    const allowed = await app.inject({ method: "GET", url: "/frappe/enquiries/1/source" });
    assert.equal(allowed.statusCode, 200);
    assert.equal(allowed.json().data[0].remoteName, "Q930");
    assert.equal(reads, 1);
  } finally {
    await app.close();
  }
});
