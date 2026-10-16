import assert from "node:assert/strict";
import { test } from "node:test";
import { EnquirySyncRepository } from "./enquiry.sync.repository.js";

test("sync status converts database Date values to ISO strings", async () => {
  const eventDate = new Date("2026-10-12T15:57:22.000Z");
  const checkedDate = new Date("2026-10-12T15:57:23.000Z");
  const tables: Record<string, unknown[]> = {
    crm_enquiry_sync_events: [
      {
        id: 8,
        event_type: "enquiry-upsert",
        status: "pending",
        attempts: 0,
        remote_name: null,
        last_error: null,
        created_at: eventDate
      }
    ],
    crm_enquiry_sync_validation: [
      {
        event_id: 8,
        validation_status: "valid",
        errors_json: ["The creator has no Frappe Employee mapping."],
        checked_at: checkedDate
      }
    ]
  };
  const database = {
    selectFrom(table: string) {
      const query = {
        selectAll: () => query,
        where: () => query,
        orderBy: () => query,
        limit: () => query,
        execute: async () => tables[table] ?? []
      };
      return query;
    }
  } as never;

  const [result] = await new EnquirySyncRepository(database).listForEnquiry(4);

  assert.equal(result?.createdAt, eventDate.toISOString());
  assert.equal(result?.validation?.checkedAt, checkedDate.toISOString());
  assert.deepEqual(result?.validation?.errors, ["The creator has no Frappe Employee mapping."]);
});
