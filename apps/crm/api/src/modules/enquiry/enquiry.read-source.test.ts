import assert from "node:assert/strict";
import { test } from "node:test";
import type { EnquiryService } from "./enquiry.service.js";
import { EnquiryReadService } from "./enquiry.read-source.js";

const query = { scope: "all" as const, page: 1, pageSize: 50, search: "", filter: "all" };

test("Local source reads only the local repository", async () => {
  let localContactId: number | undefined;
  const local = {
    listPage: async (input: { contactId?: number }) => {
      localContactId = input.contactId;
      return { items: [], total: 3, statusCounts: [] };
    }
  } as unknown as EnquiryService;
  const page = await new EnquiryReadService(local).list({ ...query, contactId: 12 });
  assert.equal(page.source, "local");
  assert.equal(page.total, 3);
  assert.equal(localContactId, 12);
});

test("CRM enquiry reads reject non-local reference identifiers", async () => {
  const local = {
    listPage: async () => {
      throw new Error("invalid filters must be rejected before local read");
    }
  } as unknown as EnquiryService;
  const read = new EnquiryReadService(local);
  await assert.rejects(() => read.list({ ...query, listInId: "Service" }), /invalid identifier/);
});
