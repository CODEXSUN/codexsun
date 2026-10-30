import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createApiApp } from "@codexsun/framework/api";
import { AppError } from "@codexsun/framework/errors";
import { createConnection } from "mysql2/promise";
import { env } from "../../apps/platform/api/src/env.js";
import {
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase,
  closeCoreDatabase,
  getCoreDatabase,
  runWithCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { registerContactRoutes } from "../../apps/core/api/src/modules/master/contact/contact.routes.js";
import { registerCrmContactRoutes } from "../../apps/crm/api/src/modules/contact/contact.routes.js";
import {
  contactCreateSchema,
  contactSchema,
  prepareContactPayloadForSave
} from "../../apps/crm/web/src/modules/contact/contact.schema.js";
import type { ContactSavePayload } from "../../apps/crm/web/src/modules/contact/contact.types.js";

test(
  "CRM mobile customer form persists create and edit through Core",
  { timeout: 60000 },
  async (suite) => {
    assert.equal(env.NODE_ENV, "development");
    const database = `codexsun_contact_upsert_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const app = await createApiApp({
      appName: "codexsun-contact-upsert-e2e",
      cookieSecret: "codexsun-contact-upsert-test-secret",
      corsOrigins: [],
      environment: "development"
    });
    suite.after(async () => {
      await app.close();
      await closeCoreDatabase();
      assert.match(database, /^codexsun_contact_upsert_e2e_[a-f0-9]{16}$/);
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
      } finally {
        await admin.end();
      }
    });
    await migrateCoreTenantDatabase(database);
    await seedCoreTenantDatabase(database);
    app.addHook("onRequest", (_request, _reply, done) => runWithCoreDatabase(database, done));
    await registerContactRoutes(app);
    let denied = false;
    registerCrmContactRoutes(app, async () => {
      if (denied) throw AppError.forbidden("Forbidden");
    });
    const type = await getCoreDatabase(database)
      .selectFrom("core_contact_types")
      .select("id")
      .where("name", "=", "Customer")
      .executeTakeFirstOrThrow();
    const input: ContactSavePayload = {
      code: "",
      name: "  Mobile customer  ",
      legalName: "MOBILE CUSTOMER",
      typeId: Number(type.id),
      groupId: null,
      gstin: null,
      pan: null,
      msmeNo: null,
      msmeCategory: null,
      tanNo: null,
      tdsAvailable: false,
      tcsAvailable: false,
      openingBalance: 25,
      creditLimit: 500,
      website: null,
      description: "Keep this note",
      status: "active",
      isActive: true,
      emails: [
        {
          id: 0,
          email: " customer@example.test ",
          emailType: "Work",
          isPrimary: true,
          sortOrder: 1
        }
      ],
      phones: [
        { id: 0, phone: " 9876543210 ", phoneType: "Mobile", isPrimary: true, sortOrder: 1 }
      ],
      addresses: [],
      bankAccounts: [],
      socialLinks: []
    };
    const payload = contactCreateSchema.parse(prepareContactPayloadForSave(input));
    const created = await app.inject({ method: "POST", url: "/crm/contacts", payload });
    assert.equal(created.statusCode, 200, created.body);
    const saved = created.json().data;
    assert.ok(saved.id);
    assert.ok(saved.code);
    const url = `/crm/contacts/${saved.id}`;
    const loaded = (await app.inject({ method: "GET", url })).json().data;
    assert.equal(loaded.name, "Mobile customer");
    assert.equal(loaded.primaryPhone, "9876543210");
    assert.equal(loaded.emails[0].email, "customer@example.test");
    const edited = contactSchema.parse(
      prepareContactPayloadForSave({
        ...payload,
        code: saved.code,
        name: "Updated customer",
        phones: [
          { ...payload.phones[0]!, isPrimary: false },
          { id: 0, phone: "9123456780", phoneType: "Mobile", isPrimary: true, sortOrder: 2 }
        ]
      })
    );
    const updated = await app.inject({ method: "PUT", url, payload: edited });
    assert.equal(updated.statusCode, 200, updated.body);
    const reloaded = (await app.inject({ method: "GET", url })).json().data;
    assert.equal(reloaded.name, "Updated customer");
    assert.equal(reloaded.primaryPhone, "9123456780");
    assert.equal(reloaded.phones.length, 2);
    assert.equal(Number(reloaded.creditLimit), 500);
    assert.equal(Number(reloaded.openingBalance), 25);
    assert.equal(reloaded.description, "Keep this note");
    assert.equal(reloaded.emails[0].email, "customer@example.test");
    const rows = await getCoreDatabase(database)
      .selectFrom("core_contacts_phones")
      .selectAll()
      .where("parent_id" as never, "=", saved.id as never)
      .execute();
    assert.equal(rows.length, 2);
    const second = await app.inject({
      method: "POST",
      url: "/crm/contacts",
      payload: { ...payload, name: "Another customer" }
    });
    assert.equal(second.statusCode, 200, second.body);
    assert.notEqual(second.json().data.id, saved.id);
    const duplicate = await app.inject({
      method: "POST",
      url: "/crm/contacts",
      payload: { ...payload, name: "  UPDATED   CUSTOMER  " }
    });
    assert.equal(duplicate.statusCode, 409, duplicate.body);
    assert.match(duplicate.json().error.message, /same customer name and phone number/);
    const conflictingEdit = await app.inject({
      method: "PUT",
      url: `/crm/contacts/${second.json().data.id}`,
      payload: { ...edited, code: second.json().data.code }
    });
    assert.equal(conflictingEdit.statusCode, 409, conflictingEdit.body);
    const ownEdit = await app.inject({ method: "PUT", url, payload: edited });
    assert.equal(ownEdit.statusCode, 200, ownEdit.body);
    const groupResult = await admin.query(
      `INSERT INTO \`${database}\`.core_contact_groups (name,status) VALUES ('Duplicate test group','active')`
    );
    const groupId = Number((groupResult[0] as { insertId: number }).insertId);
    const otherGroup = await app.inject({
      method: "POST",
      url: "/crm/contacts",
      payload: { ...payload, name: edited.name, groupId }
    });
    assert.equal(otherGroup.statusCode, 200, otherGroup.body);
    const groupDuplicate = await app.inject({
      method: "POST",
      url: "/crm/contacts",
      payload: { ...payload, name: edited.name, groupId }
    });
    assert.equal(groupDuplicate.statusCode, 409, groupDuplicate.body);
    const concurrent = await Promise.all(
      ["RACE-A", "RACE-B"].map((code) =>
        app.inject({
          method: "POST",
          url: "/crm/contacts",
          payload: { ...payload, code, name: "Concurrent customer" }
        })
      )
    );
    assert.deepEqual(concurrent.map((result) => result.statusCode).sort(), [200, 409]);
    for (const phones of [
      [],
      [{ ...payload.phones[0], phone: "123" }],
      [payload.phones[0], payload.phones[0]],
      [{ ...payload.phones[0], isPrimary: false }]
    ]) {
      assert.equal(contactCreateSchema.safeParse({ ...payload, phones }).success, false);
      for (const method of ["POST", "PUT"] as const) {
        const bad = await app.inject({
          method,
          url: method === "POST" ? "/crm/contacts" : url,
          payload: { ...edited, phones }
        });
        assert.equal(bad.statusCode, 400, bad.body);
      }
    }
    const unchanged = (await app.inject({ method: "GET", url })).json().data;
    assert.equal(unchanged.name, reloaded.name);
    assert.deepEqual(
      unchanged.phones.map((phone: { phone: string }) => phone.phone),
      reloaded.phones.map((phone: { phone: string }) => phone.phone)
    );
    denied = true;
    const forbidden = await app.inject({ method: "PUT", url, payload: edited });
    assert.equal(forbidden.statusCode, 403, forbidden.body);
  }
);
