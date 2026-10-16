import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { env } from "../../apps/platform/api/src/env.js";
import { EnquirySyncRepository } from "../../apps/crm/api/src/modules/enquiry/enquiry.sync.repository.js";
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

test("local enquiry changes enter the Frappe queue in order", async () => {
  try {
    await assert.rejects(
      database.transaction().execute(async (transaction) => {
        const enquiry = await transaction
          .selectFrom("crm_enquiries")
          .select("id")
          .orderBy("id")
          .executeTakeFirstOrThrow();
        await transaction
          .updateTable("crm_enquiry_sync_events")
          .set({ status: "synced" })
          .where("enquiry_id", "=", enquiry.id)
          .execute();

        const queue = new EnquirySyncRepository(transaction);
        const before = await queue.listQueue("all", 1, 1);
        const failedBefore = await queue.listQueue("failed", 1, 1);
        const first = await queue.enqueue(
          {
            actorEmail: "sync-test@local.invalid",
            correlationId: randomUUID(),
            enquiryId: enquiry.id,
            eventType: "enquiry-upsert"
          },
          transaction
        );
        const second = await queue.enqueue(
          {
            actorEmail: "sync-test@local.invalid",
            correlationId: randomUUID(),
            enquiryId: enquiry.id,
            eventType: "comment-add",
            entityId: 1
          },
          transaction
        );
        assert.equal((await queue.listQueue("all", 1, 1)).total, before.total + 2);

        const firstDispatch = await queue.dispatchableEvents(100);
        assert.ok(firstDispatch.some((event) => event.id === first));
        assert.ok(!firstDispatch.some((event) => event.id === second));
        assert.equal(await queue.markProcessing(first), true);
        assert.equal(await queue.markProcessing(first), false);
        await queue.markSynced(first, "ENQ-TEST");

        const nextDispatch = await queue.dispatchableEvents(100);
        assert.ok(nextDispatch.some((event) => event.id === second));
        await queue.markFailed(second, 5, "Test failure");
        assert.equal((await queue.getEvent(second))?.status, "failed");
        const failed = await queue.listQueue("failed", 1, 100);
        assert.ok(failed.items.some((event) => event.id === second));
        assert.equal(failed.total, failedBefore.total + 1);
        await queue.retry(second);
        const retried = await queue.getEvent(second);
        assert.equal(retried?.status, "pending");
        assert.equal(retried?.attempts, 0);
        assert.ok((await queue.listQueue("pending", 1, 100)).items.some((event) => event.id === second));
        throw new Error("rollback sync test");
      }),
      /rollback sync test/
    );
  } finally {
    await database.destroy();
  }
});
