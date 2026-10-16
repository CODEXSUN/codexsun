import assert from "node:assert/strict";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { migrateCrmTenantDatabase } from "../../apps/crm/api/src/modules/enquiry/enquiry.migration.js";
import type { EnquiryDatabase } from "../../apps/crm/api/src/modules/enquiry/enquiry.types.js";

assert.equal(env.NODE_ENV, "development", "This suite uses only the local development database.");
assert.notEqual(env.DEFAULT_TENANT_DB_NAME, env.DB_MASTER_NAME);

const database = new Kysely<EnquiryDatabase>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: env.DEFAULT_TENANT_DB_NAME,
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      timezone: "Z",
      connectionLimit: 2
    })
  })
});

test("local CRM records and sync references remain consistent", async () => {
  try {
    await migrateCrmTenantDatabase(database);
    const counts = await sql<{
      enquiries: number;
      comments: number;
      activity: number;
      call_logs: number;
      sync_failed: number;
      call_sync_failed: number;
      mappings: number;
    }>`
      SELECT (SELECT COUNT(*) FROM crm_enquiries) enquiries,
        (SELECT COUNT(*) FROM crm_enquiry_comments) comments,
        (SELECT COUNT(*) FROM crm_enquiry_activity) activity,
        (SELECT COUNT(*) FROM crm_call_logs) call_logs,
        (SELECT COUNT(*) FROM crm_enquiry_sync_events WHERE status='failed') sync_failed,
        (SELECT COUNT(*) FROM crm_call_log_sync_events WHERE status='failed') call_sync_failed,
        (SELECT COUNT(*) FROM frappe_enquiry_sync) mappings`.execute(database);
    const missingContacts = await sql<{ count: number }>`SELECT COUNT(*) count FROM crm_enquiries e
      LEFT JOIN core_contacts c ON c.id=e.contact_id
      WHERE e.contact_id IS NOT NULL AND c.id IS NULL`.execute(database);
    const duplicateImports = await sql<{ count: number }>`SELECT COUNT(*) count FROM (
      SELECT source_reference FROM crm_enquiries WHERE source='frappe' AND source_reference IS NOT NULL
      GROUP BY source_reference HAVING COUNT(*)>1) duplicates`.execute(database);
    const missingCallEvents = await sql<{
      count: number;
    }>`SELECT COUNT(*) count FROM crm_call_logs l
      LEFT JOIN crm_call_log_sync_events e ON e.call_log_id=l.id
      WHERE l.remote_name IS NULL AND e.id IS NULL`.execute(database);
    assert.equal(Number(missingContacts.rows[0]?.count), 0);
    assert.equal(Number(duplicateImports.rows[0]?.count), 0);
    assert.equal(Number(missingCallEvents.rows[0]?.count), 0);
    console.log("Local CRM counts", counts.rows[0]);
  } finally {
    await database.destroy();
  }
});
