import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { resolveEnquiryStatus } from "./enquiry-status.js";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const settings = {
  baseUrl: "https://frappe.example",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};

test("current Frappe statuses preserve Open, Won, Lost and Long Hold exactly", async () => {
  globalThis.fetch = async () =>
    Response.json({
      data: ["Open", "Won", "Lost", "Closed", "Long Hold"].map((name) => ({ name }))
    });
  for (const name of ["Open", "Won", "Lost", "Long Hold"])
    assert.equal(await resolveEnquiryStatus(settings, name), name);
});
test("legacy aliases require an installed status and missing mappings block", async () => {
  globalThis.fetch = async () =>
    Response.json({ data: ["Pending", "Hold", "Closed"].map((name) => ({ name })) });
  assert.equal(await resolveEnquiryStatus(settings, "Open"), "Pending");
  assert.equal(await resolveEnquiryStatus(settings, "Long Hold"), "Hold");
  await assert.rejects(resolveEnquiryStatus(settings, "Escalation"), /no Enquiry Status matching/);
  await assert.rejects(resolveEnquiryStatus(settings, "Won"), /no Enquiry Status matching/);
});
