import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "@codexsun/platform-core";
import {
  OPERATIONAL_ROLES,
  PolicyDeniedError,
  ROLE_POLICIES,
  assertPolicy,
  permissionsForRoles,
} from "../services/policies.js";

function actor(roles: string[], permissions: string[] = []): Actor {
  return { id: "actor-1", kind: "user", permissions, roles };
}

test("each operational role carries its documented permissions", () => {
  assert.deepEqual([...OPERATIONAL_ROLES].sort(), ["cashier", "kitchen", "manager", "owner", "waiter"]);
  assert.ok(ROLE_POLICIES.cashier.includes("qcafe.pos.sell"));
  assert.ok(!ROLE_POLICIES.cashier.includes("qcafe.billing.refund"));
  assert.ok(!ROLE_POLICIES.waiter.includes("qcafe.billing.bill"));
  assert.ok(ROLE_POLICIES.kitchen.includes("qcafe.kitchen.operate"));
  assert.ok(!ROLE_POLICIES.kitchen.includes("qcafe.pos.sell"));
  for (const permission of ROLE_POLICIES.manager) {
    assert.ok(ROLE_POLICIES.owner.includes(permission));
  }
});

test("the guard allows permitted actions and denies the rest", () => {
  assertPolicy(actor(["cashier"]), "qcafe.pos.sell");
  assertPolicy(actor(["manager"]), "qcafe.billing.refund");
  assertPolicy(actor(["owner"]), "qcafe.day.close");
  assertPolicy(actor([], ["qcafe.reports.view"]), "qcafe.reports.view");
  assertPolicy(actor(["owner"], []), "qcafe.settings.manage");
  assert.throws(() => assertPolicy(actor(["cashier"]), "qcafe.billing.refund"), PolicyDeniedError);
  assert.throws(() => assertPolicy(actor(["waiter"]), "qcafe.billing.bill"), PolicyDeniedError);
  assert.throws(() => assertPolicy(actor(["kitchen"]), "qcafe.cash.settle"), PolicyDeniedError);
  assert.throws(() => assertPolicy(actor(["unknown"]), "qcafe.pos.sell"), PolicyDeniedError);
  assert.throws(() => assertPolicy(undefined, "qcafe.pos.sell"), PolicyDeniedError);
  assert.deepEqual(
    permissionsForRoles(["cashier", "waiter"]).filter((permission) => permission === "qcafe.pos.sell").length,
    1,
  );
});
