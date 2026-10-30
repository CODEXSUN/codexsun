import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Kysely } from "kysely";
import { FrappeConnectionAccess } from "./connection.access.js";
import { FrappeConnectionRepository } from "./connection.repository.js";
import type { FrappeDatabase } from "./connection.types.js";

const database = (tableExists: boolean) =>
  ({
    introspection: {
      getTables: async () => (tableExists ? [{ name: "frappe_connection_settings" }] : [])
    }
  }) as unknown as Kysely<FrappeDatabase>;
const defaults = {
  baseUrl: "https://frappe.example/",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};

test("Ecommerce can use the Frappe app's environment connection when no tenant row exists", async () => {
  const access = new FrappeConnectionAccess(database(false), "secret", defaults);
  assert.equal((await access.state()).usable, true);
  assert.deepEqual(await access.credentials(), defaults);
});

test("a disabled tenant connection overrides environment defaults", async () => {
  const connection = mock.method(
    FrappeConnectionRepository.prototype,
    "connection",
    async () =>
      ({
        base_url: "https://tenant.example/",
        api_key_ciphertext: "encrypted-key",
        api_secret_ciphertext: "encrypted-secret",
        enabled: false,
        verification_status: "verified"
      }) as never
  );
  try {
    const access = new FrappeConnectionAccess(database(true), "secret", defaults);
    assert.equal((await access.state()).usable, false);
    assert.equal(await access.credentials(), null);
  } finally {
    connection.mock.restore();
  }
});

test("a verified tenant connection supplies Ecommerce credentials", async () => {
  const connection = mock.method(
    FrappeConnectionRepository.prototype,
    "connection",
    async () =>
      ({
        base_url: "https://tenant.example/",
        api_key_ciphertext: "encrypted-key",
        api_secret_ciphertext: "encrypted-secret",
        enabled: true,
        verification_status: "verified"
      }) as never
  );
  const credentials = mock.method(
    FrappeConnectionRepository.prototype,
    "credentials",
    async () =>
      ({
        settings: {
          baseUrl: "https://tenant.example/",
          apiKey: "tenant-key",
          apiSecret: "tenant-secret",
          enabled: true
        }
      }) as never
  );
  try {
    const access = new FrappeConnectionAccess(database(true), "secret", defaults);
    assert.equal((await access.state()).source, "tenant");
    assert.deepEqual(await access.credentials(), {
      baseUrl: "https://tenant.example/",
      apiKey: "tenant-key",
      apiSecret: "tenant-secret",
      enabled: true
    });
  } finally {
    connection.mock.restore();
    credentials.mock.restore();
  }
});

test("completed import disables environment fallback credentials", async () => {
  const importState = mock.method(
    FrappeConnectionRepository.prototype,
    "importState",
    async () => ({
      completedAt: "2026-10-14T10:00:00.000Z",
      completedBy: "admin@example.com"
    })
  );
  try {
    const database = {
      introspection: {
        getTables: async () => [
          { name: "frappe_import_state" },
          { name: "frappe_connection_settings" }
        ]
      }
    } as unknown as Kysely<FrappeDatabase>;
    const access = new FrappeConnectionAccess(database, "secret", defaults);
    assert.equal((await access.state()).usable, false);
    assert.equal(await access.credentials(), null);
  } finally {
    importState.mock.restore();
  }
});
