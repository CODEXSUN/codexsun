import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { Kysely } from "kysely";
import { FrappeConnectionService, requestFrappe } from "./connection.service.js";
import type { FrappeDatabase } from "./connection.types.js";

const originalFetch = globalThis.fetch;
const emptyDatabase = {
  selectFrom: () => ({
    select: () => ({ where: () => ({ executeTakeFirst: async () => undefined }) }),
    selectAll: () => ({ where: () => ({ executeTakeFirst: async () => undefined }) })
  })
} as unknown as Kysely<FrappeDatabase>;
after(() => {
  globalThis.fetch = originalFetch;
});

test("handshake uses TechMedia compatible token authentication", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://frappe.example/api/method/frappe.auth.get_logged_user");
    assert.equal(
      (init?.headers as Record<string, string> | undefined)?.Authorization,
      "token key:secret"
    );
    assert.equal(init?.redirect, "error");
    return Response.json({ message: "sync@example.com" });
  };
  const service = new FrappeConnectionService(
    emptyDatabase,
    {
      baseUrl: "https://frappe.example",
      apiKey: "key",
      apiSecret: "secret",
      enabled: true
    },
    async () => {
      throw new Error("not used");
    },
    { actorEmail: "test@example.com", actorUserId: 1, canViewAll: false }
  );
  assert.deepEqual(await service.verify(), {
    connected: true,
    user: "sync@example.com",
    saved: false
  });
});

test("disabled sync does not contact Frappe", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected network request");
  };
  const service = new FrappeConnectionService(
    emptyDatabase,
    {
      baseUrl: "https://frappe.example",
      apiKey: "key",
      apiSecret: "secret",
      enabled: false
    },
    async () => {
      throw new Error("not used");
    },
    { actorEmail: "test@example.com", actorUserId: 1, canViewAll: false }
  );
  await assert.rejects(() => service.verify(), /disabled/);
});

test("a different verification URL requires new credentials", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected network request");
  };
  const service = new FrappeConnectionService(
    emptyDatabase,
    { baseUrl: "https://frappe.example", apiKey: "key", apiSecret: "secret", enabled: true },
    async () => {
      throw new Error("not used");
    },
    { actorEmail: "test@example.com", actorUserId: 1, canViewAll: false }
  );
  await assert.rejects(
    () => service.verify({ baseUrl: "https://different.example", enabled: true }),
    /both API credentials/
  );
});

test("outbound enquiry posting remains disabled", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected network request");
  };
  const service = new FrappeConnectionService(
    emptyDatabase,
    { baseUrl: "https://frappe.example", apiKey: "key", apiSecret: "secret", enabled: true },
    async () => {
      throw new Error("unexpected local read");
    },
    { actorEmail: "local@example.com", actorUserId: 1, canViewAll: false }
  );
  await assert.rejects(() => service.sync(1), /disabled/);
});

test("Frappe transport rejects writes but permits read-only list calls", async () => {
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return Response.json({ message: [] });
  };
  const settings = {
    baseUrl: "https://frappe.example",
    apiKey: "key",
    apiSecret: "secret",
    enabled: true
  };
  await assert.rejects(
    () => requestFrappe("/api/resource/Enquiry", "POST", settings, {}),
    /disabled/
  );
  await requestFrappe("/api/v2/method/frappe.client.get_list", "POST", settings, {
    doctype: "Enquiry"
  });
  assert.equal(calls.length, 1);
});

test("Frappe transport permits an explicitly requested export write", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://frappe.example/api/resource/Contact");
    assert.equal(init?.method, "POST");
    assert.equal(init?.body, JSON.stringify({ first_name: "Local customer" }));
    return Response.json({ data: { name: "CONTACT-1" } });
  };
  const result = await requestFrappe<{ data: { name: string } }>(
    "/api/resource/Contact",
    "POST",
    { baseUrl: "https://frappe.example", apiKey: "key", apiSecret: "secret", enabled: true },
    { first_name: "Local customer" },
    { allowExport: true }
  );
  assert.equal(result.data.name, "CONTACT-1");
});
