import assert from "node:assert/strict";
import { test } from "node:test";
import type { Kysely } from "kysely";
import { FrappeConnectionService } from "./connection.service.js";
import { FrappeConnectionRepository } from "./connection.repository.js";
import type { FrappeDatabase } from "./connection.types.js";

function service(verificationStatus: "unverified" | "verified") {
  let saved: "local" | "frappe" = "local";
  const database = {
    selectFrom: (table: string) => ({
      selectAll: () => ({
        where: () => ({
          executeTakeFirst: async () => ({
            base_url: "https://frappe.example/",
            enabled: true,
            verification_status: verificationStatus,
            api_key_ciphertext: "encrypted-key",
            api_secret_ciphertext: "encrypted-secret"
          })
        })
      }),
      select: () => ({
        where: () => ({
          executeTakeFirst: async () =>
            table === "frappe_data_sources" ? { provider: saved } : undefined
        })
      })
    }),
    insertInto: () => ({
      values: (values: { provider: "local" | "frappe" }) => ({
        onDuplicateKeyUpdate: () => ({
          execute: async () => {
            saved = values.provider;
          }
        })
      })
    })
  } as unknown as Kysely<FrappeDatabase>;
  return new FrappeConnectionService(
    database,
    { baseUrl: "", apiKey: "", apiSecret: "", enabled: false },
    async () => {
      throw new Error("not used");
    },
    { actorEmail: "user@example.com", actorUserId: 1, canViewAll: false }
  );
}

test("Frappe Live cannot be selected before connection verification", async () => {
  await assert.rejects(
    () => service("unverified").saveProvider("frappe", "user@example.com"),
    /verify/
  );
});

test("verified connection can select live and then return to local", async () => {
  const connection = service("verified");
  assert.equal((await connection.saveProvider("frappe", "user@example.com")).provider, "frappe");
  assert.equal((await connection.saveProvider("local", "user@example.com")).provider, "local");
});

test("tenants without a source selection remain Local", async () => {
  const database = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => undefined
        })
      })
    })
  } as unknown as Kysely<FrappeDatabase>;
  assert.equal(await new FrappeConnectionRepository(database).provider("crm.enquiries"), "local");
});
