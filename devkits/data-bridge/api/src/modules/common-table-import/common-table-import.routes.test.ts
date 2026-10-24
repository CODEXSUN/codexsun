import assert from "node:assert/strict";
import test from "node:test";
import fastify from "fastify";
import { registerDataBridgeApi } from "../../index.js";
import {
  commonTableNames,
  coreMasterTableNames,
  coreTableNames
} from "./common-table-import.types.js";
import type { CommonTableImportHost } from "./common-table-import.types.js";

test("common table catalogue has 31 unique Core tables", () => {
  assert.equal(commonTableNames.length, 31);
  assert.equal(coreMasterTableNames.length, 16);
  assert.equal(new Set(coreTableNames).size, 47);
  for (const name of [
    "core_contacts",
    "core_companies",
    "core_products",
    "core_work_orders"
  ] as const)
    assert.ok(coreMasterTableNames.includes(name));
  assert.equal(new Set(commonTableNames).size, commonTableNames.length);
  assert.ok(commonTableNames.every((name) => /^core_[a-z0-9_]+$/u.test(name)));
});

test("Data Bridge gates lookup routes with the Super Admin host authorization", async () => {
  let denied = true;
  const host = createHost(() => {
    if (denied) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    return "super-admin@example.test";
  });
  const app = fastify();
  await registerDataBridgeApi(app, host);
  try {
    const blocked = await app.inject({ method: "GET", url: "/api/data-bridge/sources" });
    assert.equal(blocked.statusCode, 403);
    const deniedBulk = await app.inject({
      method: "POST",
      url: "/api/data-bridge/bulk-imports",
      payload: { sourceId: 1, targetTenantId: 7 }
    });
    assert.equal(deniedBulk.statusCode, 403);
    for (const [action, payload] of [
      ["prepare", { table: "core_products", sourceId: 1 }],
      [
        "commit",
        {
          planId: "00000000-0000-4000-8000-000000000002",
          fingerprint: "0".repeat(64),
          confirmed: true
        }
      ]
    ] as const) {
      const response = await app.inject({
        method: "POST",
        url: `/api/data-bridge/bulk-imports/00000000-0000-4000-8000-000000000001/corrections/${action}`,
        payload
      });
      assert.equal(response.statusCode, 403);
    }
    for (const url of [
      "/api/data-bridge/transfers",
      "/api/data-bridge/transfers/00000000-0000-4000-8000-000000000001"
    ]) {
      assert.equal((await app.inject({ method: "GET", url })).statusCode, 403);
    }
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/data-bridge/transfers",
          payload: { sourceId: 1, targetTenantId: 7 }
        })
      ).statusCode,
      403
    );

    denied = false;
    const sources = await app.inject({ method: "GET", url: "/api/data-bridge/sources" });
    assert.equal(sources.statusCode, 200);
    assert.equal(sources.json().data[0].label, "Saved source");

    const tenants = await app.inject({ method: "GET", url: "/api/data-bridge/tenants" });
    assert.equal(tenants.statusCode, 200);
    assert.equal(tenants.json().data[0].id, 7);
  } finally {
    await app.close();
  }
});

test("Data Bridge rejects table names outside its common Core allowlist", async () => {
  let sourceResolved = false;
  const host = createHost(
    () => "super-admin@example.test",
    async () => {
      sourceResolved = true;
      throw new Error("The fixed table-name validation should run before source resolution.");
    }
  );
  const app = fastify();
  await registerDataBridgeApi(app, host);
  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/data-bridge/common-tables/users/data?sourceId=1&targetTenantId=7&page=1"
    });
    assert.equal(response.statusCode, 400);
    assert.equal(sourceResolved, false);
  } finally {
    await app.close();
  }
});

function createHost(
  authorize: CommonTableImportHost["authorize"],
  resolveSource: CommonTableImportHost["dataMigration"]["resolveSource"] = async () => {
    throw new Error("This test should not open a database connection.");
  }
): CommonTableImportHost {
  return {
    database: {} as CommonTableImportHost["database"],
    authorize,
    async listTenants() {
      return [{ id: 7, label: "Test tenant", database: "test_target" }];
    },
    async resolveTenant() {
      throw new Error("This test should not open a tenant database.");
    },
    dataMigration: {
      async listSources() {
        return [
          {
            id: 1,
            label: "Saved source",
            host: "127.0.0.1",
            port: 3306,
            database: "test_source",
            user: "test_user",
            tlsMode: "disabled" as const,
            verifiedAt: null
          }
        ];
      },
      resolveSource
    }
  };
}
