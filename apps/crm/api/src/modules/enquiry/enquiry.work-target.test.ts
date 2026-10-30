import assert from "node:assert/strict";
import test from "node:test";
import type { EnquiryRequestContext } from "./enquiry.routes.js";
import { resolveEnquiryWorkTarget } from "./enquiry.work-target.js";

test("a local enquiry ID stays local while Frappe is selected", async () => {
  const scope = {
    remote: { provider: async () => "frappe" as const },
    localEnquiryIdForRemote: async () => {
      throw new Error("Numeric local IDs must not be sent to Frappe lookup.");
    }
  } as unknown as EnquiryRequestContext;

  assert.deepEqual(await resolveEnquiryWorkTarget(scope, "4"), { source: "local", id: 4 });
});

test("a linked Frappe name cannot open a CRM enquiry", async () => {
  const scope = {
    remote: { provider: async () => "frappe" as const },
    localEnquiryIdForRemote: async (name: string) => (name === "ENQ-0002" ? 4 : null)
  } as unknown as EnquiryRequestContext;

  await assert.rejects(() => resolveEnquiryWorkTarget(scope, "ENQ-0002"), /valid local enquiry ID/);
});

test("an unlinked Frappe enquiry cannot open a CRM enquiry", async () => {
  const scope = {
    remote: { provider: async () => "frappe" as const },
    localEnquiryIdForRemote: async () => null
  } as unknown as EnquiryRequestContext;

  await assert.rejects(() => resolveEnquiryWorkTarget(scope, "ENQ-0003"), /valid local enquiry ID/);
});

test("an invalid numeric enquiry ID cannot become a Frappe name", async () => {
  const scope = {
    remote: { provider: async () => "frappe" as const }
  } as unknown as EnquiryRequestContext;

  await assert.rejects(() => resolveEnquiryWorkTarget(scope, "0"), /valid local enquiry ID/);
});
