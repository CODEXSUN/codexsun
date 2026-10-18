import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createConnection } from "mysql2/promise";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import Fastify from "fastify";
import { env } from "../../apps/platform/api/src/env.js";
import { TenantRepository } from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import { closeAllTenantDatabases, getTenantDatabase } from "../../apps/platform/api/src/database/tenant-database.js";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import {
  closeCoreDatabase,
  getCoreDatabase,
  migrateCoreTenantDatabase,
  runWithCoreDatabase,
  seedCoreTenantDatabase
} from "../../apps/core/api/src/database/core-database.js";
import { ContactService } from "../../apps/core/api/src/modules/master/contact/contact.service.js";
import type { ContactSaveInput } from "../../apps/core/api/src/modules/master/contact/contact.types.js";
import { migrateTenantRuntimeModule } from "../../apps/platform/api/src/modules/tenant/tenant.migration.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/crm.migration.js";
import { FrappeConnectionAccess } from "../../apps/frappe/api/src/modules/connection/connection.access.js";
import { FrappeConnectionRepository } from "../../apps/frappe/api/src/modules/connection/connection.repository.js";
import { requestFrappe } from "../../apps/frappe/api/src/modules/connection/connection.service.js";
import type { FrappeDatabase } from "../../apps/frappe/api/src/modules/connection/connection.types.js";
import { migrateFrappeTenantDatabase } from "../../apps/frappe/api/src/modules/connection/connection.migration.js";
import { FrappeContactImportService } from "../../apps/frappe/api/src/modules/contact-import/contact-import.service.js";
import { FrappeExportService } from "../../apps/frappe/api/src/modules/export/export.service.js";

test("live Frappe contact import and CRM contact export round-trip", { timeout: 180_000 }, async (suite) => {
  assert.equal(env.NODE_ENV, "development", "Live test must use the configured development database host.");
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
  const app = Fastify({ logger: false });
  let remoteTestContact: string | null = null;
  let remoteCreateAttempted = false;
  const testName = `CODEXSUN LIVE MOBILE ${suffix}`;
  const phone = `9${String(randomInt(0, 1_000_000_000)).padStart(9, "0")}`;
  suite.after(async () => {
    try {
      if (!remoteTestContact && remoteCreateAttempted) {
        const query = new URLSearchParams({
          fields: JSON.stringify(["name", "mobile_number"]),
          filters: JSON.stringify([["mobile_number", "=", phone]]),
          limit_page_length: "3"
        });
        const matches = await requestFrappe<{ data?: Array<{ name: string; mobile_number: string }> }>(
          `/api/resource/Mobile Contact?${query}`,
          "GET",
          settings
        );
        const exact = (matches.data ?? []).filter(
          (row) => row.mobile_number?.replace(/\D/gu, "") === phone
        );
        assert.ok(exact.length <= 1, "Found multiple test Mobile Contacts during cleanup.");
        remoteTestContact = exact[0]?.name ?? null;
      }
      if (remoteTestContact) {
        await requestFrappe(
          `/api/resource/Mobile Contact/${encodeURIComponent(remoteTestContact)}`,
          "DELETE",
          settings,
          undefined,
          { allowExport: true }
        );
      }
      const remainingQuery = new URLSearchParams({
        fields: JSON.stringify(["name", "mobile_number"]),
        filters: JSON.stringify([["mobile_number", "=", phone]]),
        limit_page_length: "2"
      });
      const remaining = await requestFrappe<{ data?: Array<{ name: string }> }>(
        `/api/resource/Mobile Contact?${remainingQuery}`,
        "GET",
        settings
      );
      assert.equal(remaining.data?.length ?? 0, 0, "Test Mobile Contact was not removed from Frappe.");
      console.log(JSON.stringify({ remoteMobileContactCleanup: "verified" }));
    } finally {
      await app.close();
      await database.destroy();
      await closeCoreDatabase();
      assert.match(databaseName, /^codexsun_frappe_contact_live_[a-f0-9]{16}$/u);
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
        const [remainingDatabases] = await admin.query(
          "SELECT SCHEMA_NAME AS database_name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
          [databaseName]
        );
        assert.equal(Array.isArray(remainingDatabases) ? remainingDatabases.length : -1, 0, "Disposable contact test database remains.");
      } finally {
        await admin.end();
        await closeAllTenantDatabases();
        await closePlatformDatabase();
      }
    }
  });

  await admin.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await migrateCoreTenantDatabase(databaseName);
  await seedCoreTenantDatabase(databaseName);
  const core = getCoreDatabase(databaseName) as unknown as Kysely<FrappeDatabase>;
  await migrateTenantRuntimeModule(core as never);
  await migrateCrmTenantDatabase(core as never);
  await migrateFrappeTenantDatabase(core);
  await new FrappeConnectionRepository(core).saveConnection(
    { ...settings, connectionName: "Live contact sync test" },
    env.JWT_SECRET
  );
  await new FrappeConnectionRepository(core).recordVerification("verified");

  const importService = new FrappeContactImportService(
    core,
    env.JWT_SECRET,
    { baseUrl: "", apiKey: "", apiSecret: "", enabled: false },
    (input) => runWithCoreDatabase(databaseName, () => new ContactService().resolveExternalCustomer(input.externalKey, input.name, input.mobile))
  );
  const page = await importService.preview(1);
  const remoteAssociation = page.items.find((item) => item.name && item.customerId && item.phone);
  assert.ok(remoteAssociation, "Live Frappe returned no Mobile Contact Customer association to import.");
  const inbound = await importService.pull(remoteAssociation.name);
  assert.equal(inbound.status, "created", "The isolated test database should create the imported customer.");
  const inboundAgain = await importService.pull(remoteAssociation.name);
  assert.equal(inboundAgain.status, "linked", "Retry should resolve to the same local customer.");
  assert.equal(inboundAgain.localId, inbound.localId, "Import retry changed the local customer identity.");
  const inboundRecord = await core.selectFrom("core_contacts").select(["name", "primary_phone", "code"]).where("id", "=", inbound.localId).executeTakeFirstOrThrow();
  assert.equal(inboundRecord.name, remoteAssociation.displayName);
  assert.match(inboundRecord.code, /^EXT-[A-F0-9]{64}$/u);
  assert.equal(inboundRecord.primary_phone, remoteAssociation.phone);

  const exportService = new FrappeExportService(core, env.JWT_SECRET, {
    baseUrl: "",
    apiKey: "",
    apiSecret: "",
    enabled: false
  });
  const importedContactVerification = await exportService.exportSelection(
    "contacts",
    [inbound.localId],
    "verify",
    settings.baseUrl,
    async () => {}
  );
  assert.equal(importedContactVerification.exported, 0);
  assert.equal(importedContactVerification.failed, 0);
  assert.equal(importedContactVerification.results[0]?.outcome, "matched");
  assert.equal(importedContactVerification.results[0]?.remoteName, remoteAssociation.phone);

  const type = await core.selectFrom("core_contact_types").select("id").where("name", "=", "Customer").where("status", "=", "active").executeTakeFirstOrThrow();
  const payload: ContactSaveInput = {
    name: testName,
    typeId: type.id,
    phones: [{ phone, phoneType: "Mobile", isPrimary: true }]
  };
  const local = await runWithCoreDatabase(databaseName, () => new ContactService().create(payload));
  assert.equal(local.primaryPhone, phone, "Local Core contact did not retain its primary phone.");
  const contactPreview = await exportService.preview("contacts", 1);
  const previewRow = contactPreview.items.find((item) => item.id === local.id);
  assert.ok(previewRow);
  assert.equal(previewRow.detail, phone);
  assert.equal(previewRow.dependency, null);
  const existingMobileQuery = new URLSearchParams({
    fields: JSON.stringify(["name", "mobile_number"]),
    filters: JSON.stringify([["mobile_number", "=", phone]]),
    limit_page_length: "2"
  });
  const existingMobile = await requestFrappe<{ data?: Array<{ name: string }> }>(
    `/api/resource/Mobile Contact?${existingMobileQuery}`,
    "GET",
    settings
  );
  assert.equal(existingMobile.data?.length ?? 0, 0, "Random test mobile already exists; refusing to touch it.");
  remoteCreateAttempted = true;
  const exportOnce = await exportService.exportSelection("contacts", [local.id], "export", settings.baseUrl, async () => {});
  assert.equal(exportOnce.exported, 1, `Live Contact create failed: ${exportOnce.failures[0]?.message ?? "unknown error"}`);
  remoteTestContact = exportOnce.results[0]?.remoteName ?? null;
  assert.ok(remoteTestContact, "Frappe did not return a remote Contact name.");
  const remoteCreated = await requestFrappe<{ data: { name: string; mobile_number: string } }>(
    `/api/resource/Mobile Contact/${encodeURIComponent(remoteTestContact)}`,
    "GET",
    settings
  );
  assert.equal(remoteCreated.data.mobile_number, phone);

  const secondLocal = await runWithCoreDatabase(databaseName, () =>
    new ContactService().create({
      name: `${testName} SHARED`,
      typeId: type.id,
      phones: [{ phone, phoneType: "Mobile", isPrimary: true }]
    })
  );
  const sharedMobileExport = await exportService.exportSelection(
    "contacts",
    [secondLocal.id],
    "export",
    settings.baseUrl,
    async () => {}
  );
  assert.equal(sharedMobileExport.exported, 1);
  assert.equal(
    sharedMobileExport.results[0]?.remoteName,
    remoteTestContact,
    "Contacts sharing a mobile should link to the same Frappe Mobile Contact."
  );

  await core.updateTable("core_contacts").set({ name: `${testName} EDITED` }).where("id", "=", local.id).execute();
  const exportAgain = await exportService.exportSelection("contacts", [local.id], "export", settings.baseUrl, async () => {});
  assert.equal(exportAgain.exported, 1, `Live Contact update failed: ${exportAgain.failures[0]?.message ?? "unknown error"}`);
  assert.equal(exportAgain.results[0]?.remoteName, remoteTestContact, "Update created a second remote Contact.");
  const remoteUpdated = await requestFrappe<{ data: { name: string; mobile_number: string } }>(
    `/api/resource/Mobile Contact/${encodeURIComponent(remoteTestContact)}`,
    "GET",
    settings
  );
  assert.equal(remoteUpdated.data.mobile_number, phone);
  console.log(JSON.stringify({
    direction: { frappeToCrm: "passed", crmToFrappeCreate: "passed", crmToFrappeUpdate: "passed" },
    host: new URL(settings.baseUrl).host,
    remoteAssociationImported: true,
    importRetryKeptIdentity: true,
    sharedMobileIdentityLinked: true,
    remoteMobileContactCreatedAndUpdated: true
  }));
});
