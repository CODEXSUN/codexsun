import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { canViewCrmEnquiryFrappeSync } from "./crm-enquiry-frappe-sync-access.js";

test("Enquiry Frappe sync visibility requires the designated account and permission", async () => {
  assert.equal(await canViewCrmEnquiryFrappeSync("admin@tenant.com", async () => {}), true);
  assert.equal(await canViewCrmEnquiryFrappeSync("ADMIN@TENANT.COM", async () => {}), true);
  assert.equal(
    await canViewCrmEnquiryFrappeSync("admin@tenant.com", async () => {
      throw AppError.forbidden("Missing permission.");
    }),
    false
  );

  let permissionChecked = false;
  assert.equal(
    await canViewCrmEnquiryFrappeSync("ratheesh@example.com", async () => {
      permissionChecked = true;
    }),
    false
  );
  assert.equal(permissionChecked, false);
});

test("Enquiry Frappe sync visibility propagates non-authorization errors", async () => {
  const failure = new Error("Permission service unavailable.");
  await assert.rejects(
    () => canViewCrmEnquiryFrappeSync("admin@tenant.com", async () => { throw failure; }),
    failure
  );
});
