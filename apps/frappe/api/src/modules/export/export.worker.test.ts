import assert from "node:assert/strict";
import test from "node:test";
import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";
import { processFrappeExportJob } from "./export.worker.js";

const settings = {
  baseUrl: "https://frappe.example",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};
const unusedDatabase = {} as Kysely<FrappeDatabase>;

test("export worker rejects a job for another tenant before reading records", async () => {
  await assert.rejects(
    () =>
      processFrappeExportJob(
        unusedDatabase,
        "secret",
        settings,
        {
          tenantDatabase: "other_tenant",
          baseUrl: settings.baseUrl,
          kind: "contacts",
          mode: "verify",
          ids: [1]
        },
        "expected_tenant",
        async () => {}
      ),
    /invalid tenant/
  );
});

test("export worker rejects malformed record selections", async () => {
  await assert.rejects(
    () =>
      processFrappeExportJob(
        unusedDatabase,
        "secret",
        settings,
        {
          tenantDatabase: "expected_tenant",
          baseUrl: settings.baseUrl,
          kind: "contacts",
          mode: "verify",
          ids: []
        },
        "expected_tenant",
        async () => {}
      ),
    /invalid tenant or record/
  );
});
