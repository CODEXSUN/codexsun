import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";
import { encryptFrappeCredential } from "../connection/connection.secrets.js";
import { FrappeUserMappingService } from "./user-mapping.service.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function auditService(
  remote: { users: unknown[]; employees: unknown[] },
  mappingConnectionHash?: string,
  mappings?: Array<{
    local_user_id: number;
    frappe_user_id: string;
    frappe_email: string;
    employee_code: string;
    connection_hash: string;
    verified_at: Date;
    updated_at: Date;
  }>
) {
  const connection = {
    id: 1,
    connection_name: "Audit test",
    base_url: "https://frappe.example.test/",
    api_key_ciphertext: encryptFrappeCredential("key", "test-secret", "key"),
    api_secret_ciphertext: encryptFrappeCredential("secret", "test-secret", "secret"),
    enabled: true,
    verification_status: "verified",
    last_checked_at: null,
    last_verified_at: null,
    updated_at: new Date()
  };
  const mapping = {
    local_user_id: 7,
    frappe_user_id: "vijay@example.test",
    frappe_email: "vijay@example.test",
    employee_code: "EMP-7",
    connection_hash:
      mappingConnectionHash ?? "751510a574cdce20b55f300413c6390814d83ac7e1552525d93dc6778587a3f4",
    verified_at: new Date(),
    updated_at: new Date()
  };
  const database = {
    selectFrom(table: string) {
      const builder = {
        selectAll() {
          return builder;
        },
        select() {
          return builder;
        },
        where() {
          return builder;
        },
        orderBy() {
          return builder;
        },
        async executeTakeFirst() {
          return table === "frappe_connection_settings" ? connection : undefined;
        },
        async execute() {
          return table === "frappe_user_mappings" ? (mappings ?? [mapping]) : [];
        }
      };
      return builder;
    }
  } as unknown as Kysely<FrappeDatabase>;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    return new Response(
      JSON.stringify({ data: path.endsWith("/Employee") ? remote.employees : remote.users }),
      { status: 200 }
    );
  };
  return new FrappeUserMappingService(
    {
      database: database as never,
      localUsers: async () => [
        {
          id: 7,
          uuid: "local-7",
          name: "Vijay Anand",
          email: "vijay.local@example.test",
          status: "active"
        },
        {
          id: 8,
          uuid: "local-8",
          name: "Unmapped User",
          email: "unmapped@example.test",
          status: "active"
        }
      ],
      audit: async () => undefined
    },
    { baseUrl: "", apiKey: "", apiSecret: "", enabled: false },
    "test-secret"
  );
}

test("identity audit matches remote user and employee fields without requiring equal local email", async () => {
  const audit = await auditService({
    users: [
      {
        name: "vijay@example.test",
        full_name: "Vijay Anand",
        email: "vijay@example.test",
        enabled: 1,
        user_type: "System User"
      }
    ],
    employees: [{ name: "EMP-7", user_id: "vijay@example.test", status: "Active" }]
  }).audit();
  assert.equal(audit.totals.matched, 1);
  assert.equal(audit.totals.mismatched, 0);
  assert.equal(audit.totals.unmapped, 1);
  assert.deepEqual(audit.mappings[0]?.issues, []);
});

test("identity audit reports disabled, changed-email, inactive-employee, and stale-site mismatches", async () => {
  const audit = await auditService(
    {
      users: [
        {
          name: "vijay@example.test",
          full_name: "Vijay Anand",
          email: "changed@example.test",
          enabled: 0,
          user_type: "Website User"
        }
      ],
      employees: [{ name: "EMP-7", user_id: "other@example.test", status: "Left" }]
    },
    "old-site-hash"
  ).audit();
  assert.equal(audit.totals.mismatched, 1);
  assert.ok(audit.mappings[0]?.issues.some((issue) => issue.includes("disabled")));
  assert.ok(audit.mappings[0]?.issues.some((issue) => issue.includes("email")));
  assert.ok(audit.mappings[0]?.issues.some((issue) => issue.includes("Employee")));
  assert.ok(audit.mappings[0]?.issues.some((issue) => issue.includes("different Frappe site")));
});

test("identity audit rejects an Employee code mapped to multiple local users", async () => {
  const duplicate = {
    local_user_id: 8,
    frappe_user_id: "vijay@example.test",
    frappe_email: "vijay@example.test",
    employee_code: "EMP-7",
    connection_hash: "751510a574cdce20b55f300413c6390814d83ac7e1552525d93dc6778587a3f4",
    verified_at: new Date(),
    updated_at: new Date()
  };
  const original = { ...duplicate, local_user_id: 7 };
  const audit = await auditService(
    {
      users: [
        {
          name: "vijay@example.test",
          full_name: "Vijay Anand",
          email: "vijay@example.test",
          enabled: 1,
          user_type: "System User"
        }
      ],
      employees: [{ name: "EMP-7", user_id: "vijay@example.test", status: "Active" }]
    },
    undefined,
    [original, duplicate]
  ).audit();
  assert.equal(audit.totals.mismatched, 2);
  assert.ok(
    audit.mappings.every((item) =>
      item.issues.some((issue) => issue.includes("multiple local users"))
    )
  );
});
