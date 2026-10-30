import assert from "node:assert/strict";
import test from "node:test";
import { validateTenantPayload } from "./tenant.schema";
import type { TenantSavePayload } from "./tenant.types";

test("tenant validation does not require a custom domain", () => {
  const payload = { tenantName: "Tenant", tenantCode: "TENANT", primaryDomain: "" } as TenantSavePayload;
  assert.equal(validateTenantPayload(payload), "");
  assert.equal(validateTenantPayload({ ...payload, tenantName: "" }), "Tenant name is required.");
  assert.equal(validateTenantPayload({ ...payload, tenantCode: "" }), "Tenant code is required.");
});
