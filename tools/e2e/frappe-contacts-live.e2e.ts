import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { TenantRepository } from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import {
  closeAllTenantDatabases,
  getTenantDatabase
} from "../../apps/platform/api/src/database/tenant-database.js";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import {
  closeCoreDatabase,
  migrateCoreTenantDatabase,
  seedCoreTenantDatabase
} from "../../apps/core/api/src/index.js";
import {
  findContactIdentityByIdForDatabase,
  findContactIdentityForDatabase
} from "../../apps/core/api/src/modules/master/contact/index.js";
import {
  getCoreDatabase,
  runWithCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { ContactService } from "../../apps/core/api/src/modules/master/contact/contact.service.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { FrappeConnectionAccess } from "../../apps/frappe/api/src/modules/connection/connection.access.js";
import { FrappeConnectionRepository } from "../../apps/frappe/api/src/modules/connection/connection.repository.js";
import { requestFrappe } from "../../apps/frappe/api/src/modules/connection/connection.service.js";
import type {
  FrappeDatabase,
  FrappeSettings
} from "../../apps/frappe/api/src/modules/connection/connection.types.js";
import { migrateFrappeTenantDatabase } from "../../apps/frappe/api/src/modules/connection/connection.migration.js";
import { FrappeContactImportService } from "../../apps/frappe/api/src/modules/contact-import/contact-import.service.js";
import { FrappeExportService } from "../../apps/frappe/api/src/modules/export/export.service.js";

test(
  "live Frappe customer import and CRM mobile-only contact export",
  { timeout: 180_000 },
  async (suite) => {
    assert.equal(
      env.NODE_ENV,
      "development",
      "Live test must use the configured development database host."
    );
    const tenantCode = process.env.CODEXSUN_FRAPPE_LIVE_TENANT || env.DEFAULT_TENANT_CORPORATE_ID;
    const tenant = await new TenantRepository().findByIdOrCode(tenantCode);
    assert.ok(tenant && tenant.status === "active", "Select an active tenant for live sync.");
    const tenantDb = getTenantDatabase(tenant);
    const tenantAccess = new FrappeConnectionAccess(tenantDb as never, env.JWT_SECRET, {
      baseUrl: "",
      apiKey: "",
      apiSecret: "",
      enabled: false
    });
    const settings = await tenantAccess.exportCredentials();
    assert.ok(settings, "Save, enable, and verify a tenant Frappe connection first.");
    assert.equal(
      new URL(settings.baseUrl).hostname,
      process.env.CODEXSUN_FRAPPE_LIVE_HOST || "logicx.tmnext.in",
      "The saved connection must match the selected live host."
    );
    const handshake = await requestFrappe<{ message?: string }>(
      "/api/method/frappe.auth.get_logged_user",
      "GET",
      settings
    );
    assert.ok(handshake.message, "Frappe did not identify the saved connection user.");

    const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
    const databaseName = `codexsun_frappe_contact_live_${suffix}`;
    const admin = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });
    const database = new Kysely<FrappeDatabase>({
      dialect: new MysqlDialect({
        pool: createPool({
          database: databaseName,
          host: env.DB_HOST,
          port: env.DB_PORT,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          timezone: "Z"
        })
      })
    });
    let mobileFixtureToCleanup: string | null = null;
    suite.after(async () => {
      try {
        if (mobileFixtureToCleanup) {
          await cleanupMobileContact(mobileFixtureToCleanup, settings);
        }
      } finally {
        try {
          await database.destroy();
          await closeCoreDatabase();
          assert.match(databaseName, /^codexsun_frappe_contact_live_[a-f0-9]{16}$/u);
          await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
          const [remainingDatabases] = await admin.query(
            "SELECT SCHEMA_NAME AS database_name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
            [databaseName]
          );
          assert.equal(
            Array.isArray(remainingDatabases) ? remainingDatabases.length : -1,
            0,
            "Disposable contact test database remains."
          );
        } finally {
          await admin.end();
          await closeAllTenantDatabases();
          await closePlatformDatabase();
        }
      }
    });

    await admin.query(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await migrateCoreTenantDatabase(databaseName);
    await seedCoreTenantDatabase(databaseName);
    const core = getCoreDatabase(databaseName) as unknown as Kysely<FrappeDatabase>;
    await migrateTenantRuntimeModule(core as never);
    await migrateCrmTenantDatabase(core as never);
    await migrateFrappeTenantDatabase(core);
    await new FrappeConnectionRepository(core).saveConnection(
      { ...settings, connectionName: "Live contact identity verification" },
      env.JWT_SECRET
    );
    await new FrappeConnectionRepository(core).recordVerification("verified");

    const lookups = {
      findContactByCode: (code: string) => findContactIdentityForDatabase(databaseName, code),
      findContactById: (id: number) => findContactIdentityByIdForDatabase(databaseName, id)
    };
    const importService = new FrappeContactImportService(
      core,
      env.JWT_SECRET,
      { baseUrl: "", apiKey: "", apiSecret: "", enabled: false },
      (input) =>
        runWithCoreDatabase(databaseName, () =>
          new ContactService().resolveExternalContact(
            input.externalKey,
            input.externalCode,
            input.name,
            input.mobile,
            input.contactType,
            input.existingContactId
          )
        )
    );
    const page = await importService.preview(1, lookups);
    const remoteAssociation = page.items.find((item) => item.name && item.customerId && item.phone);
    assert.ok(
      remoteAssociation,
      "Live Frappe returned no Mobile Contact Customer association to import."
    );
    assert.equal(remoteAssociation.identityStatus, "new");
    const inbound = await importService.pull(remoteAssociation.name, lookups.findContactById);
    assert.equal(
      inbound.localCode,
      remoteAssociation.customerId,
      "Core code must be the Frappe Customer document ID."
    );
    const inboundAgain = await importService.pull(remoteAssociation.name, lookups.findContactById);
    assert.equal(
      inboundAgain.localId,
      inbound.localId,
      "Import retry created another local contact."
    );
    assert.equal(inboundAgain.localCode, remoteAssociation.customerId);
    assert.equal(inboundAgain.status, "linked");
    const inboundRecord = await core
      .selectFrom("core_contacts")
      .select(["name", "primary_phone", "code"])
      .where("id", "=", inbound.localId)
      .executeTakeFirstOrThrow();
    assert.equal(inboundRecord.name, remoteAssociation.displayName);
    assert.equal(inboundRecord.code, remoteAssociation.customerId);
    assert.equal(inboundRecord.primary_phone, remoteAssociation.phone);
    assert.equal(
      (await importService.preview(1, lookups)).items.find(
        (item) => item.name === remoteAssociation.name
      )?.identityStatus,
      "matched"
    );

    const exportService = new FrappeExportService(core, env.JWT_SECRET, {
      baseUrl: "",
      apiKey: "",
      apiSecret: "",
      enabled: false
    });
    const matchedExport = await exportService.exportSelection(
      "contacts",
      [inbound.localId],
      "verify",
      settings.baseUrl,
      async () => {}
    );
    assert.equal(matchedExport.exported, 0);
    assert.equal(matchedExport.failed, 0);
    assert.ok(["matched", "linked"].includes(matchedExport.results[0]?.outcome ?? ""));
    assert.equal(matchedExport.results[0]?.remoteName, remoteAssociation.phone);

    const inboundContact = await runWithCoreDatabase(databaseName, () =>
      new ContactService().find(String(inbound.localId))
    );
    assert.ok(inboundContact?.typeId, "Imported Core contact has no contact type.");
    const testMobile = await uniqueFrappeMobile(settings);
    mobileFixtureToCleanup = testMobile;
    await runWithCoreDatabase(databaseName, () =>
      new ContactService().update(String(inbound.localId), {
        code: inboundContact.code,
        name: inboundContact.name,
        typeId: inboundContact.typeId!,
        phones: [{ phone: testMobile, phoneType: "Mobile", isPrimary: true }]
      })
    );
    const createVerification = await exportService.exportSelection(
      "contacts",
      [inbound.localId],
      "verify",
      settings.baseUrl,
      async () => {}
    );
    assert.equal(createVerification.failed, 0);
    assert.equal(createVerification.results[0]?.outcome, "new");

    const originalFetch = globalThis.fetch;
    const contactWritePayloads: unknown[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (
        decodeURIComponent(url.pathname).startsWith("/api/resource/Mobile Contact") &&
        ["POST", "PUT"].includes(String(init?.method ?? "GET"))
      ) {
        contactWritePayloads.push(JSON.parse(String(init?.body ?? "{}")) as unknown);
      }
      return originalFetch(input, init);
    };
    try {
      const createdMobile = await exportService.exportSelection(
        "contacts",
        [inbound.localId],
        "export",
        settings.baseUrl,
        async () => {}
      );
      const repeatedMobile = await exportService.exportSelection(
        "contacts",
        [inbound.localId],
        "export",
        settings.baseUrl,
        async () => {}
      );
      assert.equal(createdMobile.exported, 1);
      assert.equal(createdMobile.results[0]?.outcome, "exported");
      assert.equal(createdMobile.results[0]?.remoteName, testMobile);
      assert.equal(repeatedMobile.exported, 1);
      assert.equal(repeatedMobile.results[0]?.remoteName, testMobile);
      assert.deepEqual(contactWritePayloads, [
        { mobile_number: testMobile },
        { mobile_number: testMobile }
      ]);
      const postedMobile = await requestFrappe<{
        data?: { name?: string; mobile_number?: string };
      }>(`/api/resource/Mobile Contact/${encodeURIComponent(testMobile)}`, "GET", settings);
      assert.equal(postedMobile.data?.name, testMobile);
      assert.equal(postedMobile.data?.mobile_number, testMobile);
    } finally {
      globalThis.fetch = originalFetch;
    }

    const customerType = await core
      .selectFrom("core_contact_types")
      .select("id")
      .where("name", "=", "Customer")
      .where("status", "=", "active")
      .executeTakeFirstOrThrow();
    const unmatched = await runWithCoreDatabase(databaseName, () =>
      new ContactService().create({
        code: `LOCAL-${suffix.toUpperCase()}`,
        name: `Local only ${suffix}`,
        typeId: customerType.id,
        phones: [{ phone: "9000000000", phoneType: "Mobile", isPrimary: true }]
      })
    );
    const mismatch = await exportService.exportSelection(
      "contacts",
      [unmatched.id],
      "verify",
      settings.baseUrl,
      async () => {}
    );
    assert.equal(mismatch.results[0]?.outcome, "mismatch");
    assert.match(mismatch.results[0]?.message ?? "", /No new Frappe record will be created/u);
    const blockedExport = await exportService.exportSelection(
      "contacts",
      [unmatched.id],
      "export",
      settings.baseUrl,
      async () => {}
    );
    assert.equal(blockedExport.exported, 0, "A mismatch must not create a Frappe record.");
    assert.equal(blockedExport.failed, 1);
    console.log(
      JSON.stringify({
        direction: {
          frappeToCrm: "passed",
          crmToFrappeIdentityMatch: "passed",
          crmToFrappeMobilePost: "passed",
          crmToFrappeMismatchBlocked: "passed"
        },
        host: new URL(settings.baseUrl).host,
        frappeCustomerId: remoteAssociation.customerId,
        importRetryKeptIdentity: true,
        postedMobile: testMobile,
        onlyFieldPosted: "mobile_number",
        repeatedExportKeptMobileContact: true,
        mismatchDoesNotCreateRemoteRecord: true
      })
    );
  }
);

async function uniqueFrappeMobile(settings: FrappeSettings) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const mobile = `6${String(randomInt(0, 1_000_000_000)).padStart(9, "0")}`;
    const existing = await listMobileContacts(settings, mobile);
    if (!existing.length) return mobile;
  }
  throw new Error("Could not find an unused synthetic Frappe mobile number.");
}

async function listMobileContacts(settings: FrappeSettings, mobile: string) {
  const query = new URLSearchParams({
    fields: JSON.stringify(["name", "mobile_number"]),
    filters: JSON.stringify([["name", "=", mobile]]),
    limit_page_length: "2"
  });
  const response = await requestFrappe<{
    data?: Array<{ name: string; mobile_number: string }>;
  }>(`/api/resource/Mobile Contact?${query}`, "GET", settings);
  return response.data ?? [];
}

async function cleanupMobileContact(mobile: string, settings: FrappeSettings) {
  const fixture = await listMobileContacts(settings, mobile);
  for (const record of fixture) {
    assert.equal(record.name, mobile, "Refusing to delete a non-fixture Mobile Contact.");
    assert.equal(
      record.mobile_number,
      mobile,
      "Refusing to delete a Mobile Contact with a different number."
    );
    await requestFrappe(
      `/api/resource/Mobile Contact/${encodeURIComponent(record.name)}`,
      "DELETE",
      settings,
      undefined,
      { allowExport: true }
    );
  }
  assert.equal((await listMobileContacts(settings, mobile)).length, 0);
}
