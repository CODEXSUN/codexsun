import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { canViewCrmEnquiryFrappeSync } from "./crm-enquiry-frappe-sync-access.js";

test("Enquiry Frappe sync visibility follows the permission grant", async () => {
  assert.equal(await canViewCrmEnquiryFrappeSync(async () => {}), true);
  assert.equal(
    await canViewCrmEnquiryFrappeSync(async () => {
      throw AppError.forbidden("Missing permission.");
    }),
    false
  );
});

test("Enquiry Frappe sync visibility propagates non-authorization errors", async () => {
  const failure = new Error("Permission service unavailable.");
  await assert.rejects(() => canViewCrmEnquiryFrappeSync(async () => { throw failure; }), failure);
});
