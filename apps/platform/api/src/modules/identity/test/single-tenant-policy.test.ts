import assert from "node:assert/strict";
import test from "node:test";
import { SingleTenantPolicy } from "../policy/single-tenant-policy.js";

test("binds the Identity module to one configured deployment", () => {
  const policy = new SingleTenantPolicy({
    deploymentName: "aaran",
    bootstrapAdminEmail: "admin@admin.com",
  });

  assert.equal(policy.mode, "single");
  assert.equal(policy.appliesToDeployment("aaran"), true);
  assert.equal(policy.appliesToDeployment("another-client"), false);
});
