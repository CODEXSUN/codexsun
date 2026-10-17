import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { sql, type Kysely } from "kysely";
import Fastify from "fastify";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { env } from "../../apps/platform/api/src/env.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  closeCoreDatabase,
  getCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { ContactService } from "../../apps/core/api/src/modules/master/contact/contact.service.js";
import { runWithCoreDatabase } from "../../apps/core/api/src/database/core-database.js";
import { resolveExternalCustomerForDatabase } from "../../apps/core/api/src/modules/master/contact/index.js";
import {
  migrateFrappeTenantDatabase,
  type FrappeDatabase
} from "../../apps/frappe/api/src/modules/connection/index.js";
import { FrappeContactImportService } from "../../apps/frappe/api/src/modules/contact-import/contact-import.service.js";
import { frappeContactImportModule } from "../../apps/frappe/api/src/modules/contact-import/index.js";
import { FrappeConnectionRepository } from "../../apps/frappe/api/src/modules/connection/connection.repository.js";

test(
  "Mobile Contact Customer imports preserve customer identities and mobile associations",
  { timeout: 60_000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const name = `codexsun_mobile_customer_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const originalFetch = globalThis.fetch;
    const app = Fastify({ logger: false });
    suite.after(async () => {
      globalThis.fetch = originalFetch;
      await app.close();
      await closeCoreDatabase();
      assert.match(name, /^codexsun_mobile_customer_e2e_[a-f0-9]{16}$/);
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      } finally {
        await admin.end();
      }
    });
    await migrateCoreTenantDatabase(name);
    await seedCoreTenantDatabase(name);
    const db = getCoreDatabase(name) as unknown as Kysely<FrappeDatabase>;
    await migrateTenantRuntimeModule(db as never);
    await migrateCrmTenantDatabase(db as never);
    await migrateFrappeTenantDatabase(db);
    const pairs = [
      {
        name: "PAIR-A1",
        mobile_contact: "9876543210",
        customer: "CUSTOMER-A",
        customer_name: "Old display name"
      },
      {
        name: "PAIR-B1",
        mobile_contact: "9876543210",
        customer: "CUSTOMER-B",
        customer_name: "Customer B"
      },
      {
        name: "PAIR-A2",
        mobile_contact: "9123456780",
        customer: "CUSTOMER-A",
        customer_name: "Customer A"
      },
      {
        name: "PAIR-A3",
        mobile_contact: "9234567890",
        customer: "CUSTOMER-A",
        customer_name: "Customer A"
      }
    ];
    const settings = {
      baseUrl: "https://frappe.test",
      apiKey: "test-key",
      apiSecret: "test-secret",
      enabled: true
    };
    await new FrappeConnectionRepository(db).saveConnection(
      { ...settings, connectionName: "Test" },
      "test-encryption-secret"
    );
    await new FrappeConnectionRepository(db).recordVerification("verified");
    let disabled = false;
    let malformedMobile = false;
    const paths: string[] = [];
    globalThis.fetch = async (input, init) => {
      assert.equal(init?.method, "GET", "customer source must never write to Frappe");
      const url = new URL(String(input));
      const path = decodeURIComponent(url.pathname);
      paths.push(path);
      if (path === "/api/resource/Mobile Contact Customer") return Response.json({ data: pairs });
      if (path.startsWith("/api/resource/Mobile Contact Customer/"))
        return Response.json({ data: pairs.find((p) => p.name === path.split("/").at(-1)) });
      if (path.startsWith("/api/resource/Mobile Contact/")) {
        const mobile = path.split("/").at(-1);
        return Response.json({
          data: { name: mobile, mobile_number: malformedMobile ? "0000000000" : mobile }
        });
      }
      if (path.startsWith("/api/resource/Customer/")) {
        const customer = path.split("/").at(-1);
        return Response.json({
          data: {
            name: customer,
            customer_name: customer === "CUSTOMER-A" ? "Customer A" : "Customer B",
            disabled: disabled ? 1 : 0
          }
        });
      }
      throw new Error(`Unexpected remote path ${path}`);
    };
    const resolveContact = (input: { externalKey: string; name: string; mobile: string }) =>
      resolveExternalCustomerForDatabase(name, input);
    let deny = false;
    await frappeContactImportModule.register(
      app,
      async () => {
        if (deny) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        return { database: db, resolveContact };
      },
      settings,
      "test-encryption-secret"
    );
    const service = new FrappeContactImportService(
      db,
      "test-encryption-secret",
      settings,
      resolveContact
    );
    await sql`INSERT INTO frappe_contact_imports (remote_name,local_contact_id) VALUES ('PAIR-A1',99999)`.execute(
      db
    );
    const before = await service.preview(1);
    assert.equal(before.source, "mobile-contact-customer");
    assert.equal(before.items.length, 4);
    assert.ok(
      before.items.every((row) => row.localContactId === null),
      "legacy person Contact links must not mark mobile/customer pairs as imported"
    );
    malformedMobile = true;
    await assert.rejects(service.pull("PAIR-A1"), /Mobile Contact is invalid/);
    malformedMobile = false;
    await assert.rejects(service.pull("missing-pair"), /invalid fields/);
    const a = await service.pull("PAIR-A1");
    await sql`INSERT INTO core_contacts_emails (parent_id,email,email_type,is_primary) VALUES (${a.localId},'retained@local.invalid','Primary',1)`.execute(
      db
    );
    await assert.rejects(
      runWithCoreDatabase(name, () =>
        new ContactService().update(String(a.localId), {
          code: "CHANGED",
          name: "Customer A",
          typeId: 1
        })
      ),
      /externally linked customer code cannot change/
    );
    const b = await service.pull("PAIR-B1");
    assert.notEqual(a.localId, b.localId, "shared mobile must not merge two customers");
    const more = await Promise.all([
      service.pull("PAIR-A2"),
      service.pull("PAIR-A3"),
      service.pull("PAIR-A2")
    ]);
    assert.ok(
      more.every((row) => row.localId === a.localId),
      "one customer with multiple mobiles must keep one Core identity"
    );
    assert.equal((await service.pull("PAIR-A1")).status, "linked");
    const customers = await sql<{
      name: string;
      primary_phone: string;
    }>`SELECT name,primary_phone FROM core_contacts WHERE id IN (${a.localId},${b.localId}) ORDER BY name`.execute(
      db
    );
    assert.deepEqual(
      customers.rows.map((row) => row.name),
      ["Customer A", "Customer B"],
      "use actual Customer name rather than stale association display name"
    );
    const phones = await sql<{
      phone: string;
      is_primary: number;
    }>`SELECT phone,is_primary FROM core_contacts_phones WHERE parent_id=${a.localId} ORDER BY phone`.execute(
      db
    );
    const retained = await sql<{
      total: number;
    }>`SELECT COUNT(*) AS total FROM core_contacts_emails WHERE parent_id=${a.localId} AND email='retained@local.invalid'`.execute(
      db
    );
    assert.equal(
      Number(retained.rows[0]?.total),
      1,
      "adding imported mobiles preserves existing email rows"
    );
    assert.equal(phones.rows.length, 3);
    assert.equal(phones.rows.filter((row) => row.is_primary).length, 1);
    assert.ok((await service.preview(1)).items.every((row) => row.localContactId !== null));
    const concurrent = await Promise.all([
      resolveContact({ externalKey: "e".repeat(64), name: "Concurrent", mobile: "9345678901" }),
      resolveContact({ externalKey: "e".repeat(64), name: "Concurrent", mobile: "9456789012" })
    ]);
    assert.equal(concurrent[0]!.id, concurrent[1]!.id);
    const inactive =
      await sql`UPDATE core_contacts SET status='suspend' WHERE id=${a.localId}`.execute(db);
    assert.ok(inactive);
    await assert.rejects(service.pull("PAIR-A1"), /inactive/);
    disabled = true;
    await assert.rejects(service.pull("PAIR-B1"), /disabled/);
    disabled = false;
    const route = await app.inject({ method: "GET", url: "/frappe/contacts/remote" });
    assert.equal(route.statusCode, 200, route.body);
    assert.equal(route.json().data.source, "mobile-contact-customer");
    deny = true;
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/frappe/contacts/pull",
          payload: { remoteName: "PAIR-B1" }
        })
      ).statusCode,
      403
    );
    assert.ok(
      paths.every((path) => !path.startsWith("/api/resource/Contact")),
      "person-level Frappe Contact must not be queried"
    );
    await new FrappeConnectionRepository(db).saveConnection(
      { ...settings, baseUrl: "https://other-frappe.test", connectionName: "Other source" },
      "test-encryption-secret"
    );
    await new FrappeConnectionRepository(db).recordVerification("verified");
    assert.ok(
      (await service.preview(1)).items.every((row) => row.localContactId === null),
      "links are scoped to the verified source connection"
    );
    await assert.rejects(
      service.pull("PAIR-B1"),
      /same customer name and phone number/,
      "a separate source identity cannot create a duplicate within the local group"
    );
    await new FrappeConnectionRepository(db).completeImport("test-actor");
    await assert.rejects(service.preview(1), /Verify the Frappe connection/);
  }
);
